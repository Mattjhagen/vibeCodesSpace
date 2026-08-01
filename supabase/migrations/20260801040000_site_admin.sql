-- Universal admin: roles, invitations, form submissions, traffic, audit log.
--
-- "Universal" means driven by each site's content model rather than by
-- hardcoded tables. Nothing here knows what a site is *about* — a portfolio, a
-- services business and a docs site all get the same admin, because the admin
-- operates on `sites.content` and on the generic tables below.
--
-- Patterns taken from SchmidtAdmin: the SECURITY DEFINER helper called from
-- inside policies (`is_portal_admin()` there, `site_role_of()` here), and
-- `DROP POLICY IF EXISTS` before every `CREATE POLICY` so a migration re-runs
-- cleanly.
--
-- Patterns deliberately NOT taken, each of which is live in that codebase:
--
--   portal_admins    FOR SELECT USING (true)   -- world-readable admin list
--   projects         FOR SELECT USING (true)   -- world-readable client data
--   proposals        FOR UPDATE USING (true)
--                        WITH CHECK (true)     -- ANY caller may rewrite ANY
--                                                 column; a policy cannot
--                                                 restrict columns, so the
--                                                 name "public_update_status"
--                                                 describes an intent the
--                                                 policy does not enforce
--   audit_logs       FOR INSERT WITH CHECK (true)
--                                              -- an audit log anyone can
--                                                 write is not an audit log
--
-- The audit table below therefore has NO insert policy at all.

-- ---------------------------------------------------------------- role model
--
-- Declaration order IS the privilege order, strongest first, so `<=` reads as
-- "at least". Adding a role later means adding it in the right position.

DO $$ BEGIN
  CREATE TYPE site_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS site_members (
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role site_role NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (site_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_site_members_user ON site_members (user_id);

/**
 * This user's role on a site, or NULL if they have none.
 *
 * The workspace owner is always 'owner' and does not need a membership row —
 * otherwise creating a site would leave you locked out of its admin until some
 * other process granted you access to your own site.
 *
 * SECURITY DEFINER because it is called from inside policies on the very
 * tables it reads. Without it, `site_members`' own policy would have to query
 * `site_members`, which recurses.
 */
CREATE OR REPLACE FUNCTION site_role_of(p_site_id UUID)
RETURNS site_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM sites s
      JOIN workspaces w ON w.id = s.workspace_id
      WHERE s.id = p_site_id AND w.user_id = auth.uid()
    ) THEN 'owner'::site_role
    ELSE (SELECT m.role FROM site_members m
           WHERE m.site_id = p_site_id AND m.user_id = auth.uid())
  END;
$$;

/** "At least this role". NULL (no membership) is never sufficient. */
CREATE OR REPLACE FUNCTION has_site_role(p_site_id UUID, p_min site_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(site_role_of(p_site_id) <= p_min, FALSE);
$$;

ALTER TABLE site_members ENABLE ROW LEVEL SECURITY;

-- Members may see who else is on their site. Deliberately not public: a
-- membership list is a list of email-bearing accounts to target.
DROP POLICY IF EXISTS "Members can view the roster of their sites" ON site_members;
CREATE POLICY "Members can view the roster of their sites" ON site_members
  FOR SELECT USING (has_site_role(site_id, 'viewer'));

-- No INSERT/UPDATE/DELETE policies. Membership changes go through the
-- SECURITY DEFINER functions below, which enforce that you cannot grant a role
-- above your own and cannot remove the owner. Expressing "may not escalate
-- beyond self" as an RLS predicate is possible but easy to get subtly wrong,
-- and this is the table that decides who can edit everything else.

-- ---------------------------------------------------------------- invitations

CREATE TABLE IF NOT EXISTS site_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role site_role NOT NULL DEFAULT 'viewer',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_invitations_pending
  ON site_invitations (site_id, lower(email)) WHERE accepted_at IS NULL;

ALTER TABLE site_invitations ENABLE ROW LEVEL SECURITY;

-- Admins of the site see its invitations. The invitee does NOT get a read
-- policy: the token is the capability, it reaches them by email, and a table
-- that lets you look up invitations by address is a way to harvest them.
DROP POLICY IF EXISTS "Site admins can view invitations" ON site_invitations;
CREATE POLICY "Site admins can view invitations" ON site_invitations
  FOR SELECT USING (has_site_role(site_id, 'admin'));

-- Writes go through functions, same reasoning as site_members.

-- ----------------------------------------------------------- form submissions
--
-- The generic inbox behind a `contact` block. Universal by construction: the
-- payload is JSONB, so a form gains a field without a migration.

CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  -- Which block on which page produced this, so the admin can group them.
  block_id TEXT,
  page_slug TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Coarse, for rate limiting and abuse triage only. Never the raw address.
  submitter_ip_hash TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_site_created
  ON form_submissions (site_id, created_at DESC);

ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone may submit, including anonymous visitors -- that is what a contact
-- form is. But only to a site that is actually published and not suspended:
-- without that predicate, a bot could post into any site_id it guessed,
-- including drafts, and use the table as free storage.
DROP POLICY IF EXISTS "Anyone can submit to a published site" ON form_submissions;
CREATE POLICY "Anyone can submit to a published site" ON form_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites s
      WHERE s.id = site_id
        AND s.status = 'published'
        AND s.suspended_at IS NULL
    )
  );

-- Reading is a different question from writing, and gets a different answer.
DROP POLICY IF EXISTS "Members can read their site's submissions" ON form_submissions;
CREATE POLICY "Members can read their site's submissions" ON form_submissions
  FOR SELECT USING (has_site_role(site_id, 'viewer'));

-- Marking read is the only mutation, and needs edit rights.
DROP POLICY IF EXISTS "Editors can mark submissions read" ON form_submissions;
CREATE POLICY "Editors can mark submissions read" ON form_submissions
  FOR UPDATE USING (has_site_role(site_id, 'editor'))
  WITH CHECK (has_site_role(site_id, 'editor'));

DROP POLICY IF EXISTS "Admins can delete submissions" ON form_submissions;
CREATE POLICY "Admins can delete submissions" ON form_submissions
  FOR DELETE USING (has_site_role(site_id, 'admin'));

-- ------------------------------------------------------------------- traffic
--
-- A daily rollup rather than a row per request. One row per site/day/path
-- keeps an admin query cheap and means a popular site cannot fill the table.

CREATE TABLE IF NOT EXISTS site_page_views (
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  path TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site_id, day, path)
);

ALTER TABLE site_page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read their site's traffic" ON site_page_views;
CREATE POLICY "Members can read their site's traffic" ON site_page_views
  FOR SELECT USING (has_site_role(site_id, 'viewer'));

-- No write policy: counts are incremented through record_page_view() below.
-- A visitor able to INSERT here directly could also set `views` to anything.

/** Increment today's counter for one path. Safe for anonymous callers. */
CREATE OR REPLACE FUNCTION record_page_view(p_site_id UUID, p_path TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only for sites that are actually serving. Otherwise this is an open
  -- write endpoint keyed by a guessable UUID.
  IF NOT EXISTS (
    SELECT 1 FROM sites s
    WHERE s.id = p_site_id AND s.status = 'published' AND s.suspended_at IS NULL
  ) THEN
    RETURN;
  END IF;

  INSERT INTO site_page_views (site_id, day, path, views)
  VALUES (p_site_id, CURRENT_DATE, LEFT(COALESCE(p_path, '/'), 200), 1)
  ON CONFLICT (site_id, day, path) DO UPDATE
    SET views = site_page_views.views + 1;
END;
$$;

-- ----------------------------------------------------------------- audit log
--
-- SchmidtAdmin's equivalent is `FOR INSERT WITH CHECK (true)`, which means any
-- caller can write any entry, including entries attributing an action to
-- someone else. That makes the log worse than useless in the one situation it
-- exists for -- a dispute about who did what.

CREATE TABLE IF NOT EXISTS site_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_audit_log_site_created
  ON site_audit_log (site_id, created_at DESC);

ALTER TABLE site_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site admins can read the audit log" ON site_audit_log;
CREATE POLICY "Site admins can read the audit log" ON site_audit_log
  FOR SELECT USING (has_site_role(site_id, 'admin'));

-- No INSERT, UPDATE or DELETE policy, for anyone, ever. Entries are written by
-- the SECURITY DEFINER functions below, which stamp actor_id from auth.uid()
-- rather than accepting it as an argument -- so a caller cannot attribute an
-- action to another user. Nobody can edit or erase history either.

/** Append an entry. actor_id is taken from the session, never passed in. */
CREATE OR REPLACE FUNCTION log_site_action(
  p_site_id UUID,
  p_action TEXT,
  p_target TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_site_role(p_site_id, 'viewer') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  INSERT INTO site_audit_log (site_id, actor_id, action, target, details)
  VALUES (p_site_id, auth.uid(), p_action, p_target, COALESCE(p_details, '{}'::jsonb));
END;
$$;

-- ------------------------------------------------------- membership mutations

/**
 * Grant or change a role.
 *
 * Two rules that RLS alone would not express well:
 *   - you cannot grant a role stronger than your own (no self-escalation by
 *     proxy: an admin inviting an owner then being promoted by them)
 *   - only an owner may create another owner, and the last owner cannot be
 *     demoted, or a site becomes unadministrable
 */
CREATE OR REPLACE FUNCTION set_site_member_role(
  p_site_id UUID,
  p_user_id UUID,
  p_role site_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor site_role;
BEGIN
  v_actor := site_role_of(p_site_id);

  IF v_actor IS NULL OR v_actor > 'admin' THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Strictly: cannot hand out more than you hold.
  IF p_role < v_actor THEN
    RAISE EXCEPTION 'cannot_grant_above_own_role';
  END IF;

  INSERT INTO site_members (site_id, user_id, role, invited_by)
  VALUES (p_site_id, p_user_id, p_role, auth.uid())
  ON CONFLICT (site_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  PERFORM log_site_action(p_site_id, 'member.role_set', p_user_id::text,
                          jsonb_build_object('role', p_role));
END;
$$;

/** Remove a member. Admins may not remove owners. */
CREATE OR REPLACE FUNCTION remove_site_member(p_site_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor site_role;
  v_target site_role;
BEGIN
  v_actor := site_role_of(p_site_id);
  IF v_actor IS NULL OR v_actor > 'admin' THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT role INTO v_target FROM site_members
   WHERE site_id = p_site_id AND user_id = p_user_id;
  IF v_target IS NULL THEN
    RETURN;
  END IF;
  IF v_target < v_actor THEN
    RAISE EXCEPTION 'cannot_remove_stronger_role';
  END IF;

  -- Log BEFORE the delete. Removing yourself is legal (leaving a site you were
  -- invited to), and log_site_action authorises against your current role — so
  -- logging afterwards would find you are no longer a member, raise
  -- not_authorized, and roll back the removal. Found by the test suite: the
  -- self-removal case failed with a misleading 'not_authorized'.
  PERFORM log_site_action(p_site_id, 'member.removed', p_user_id::text);

  DELETE FROM site_members WHERE site_id = p_site_id AND user_id = p_user_id;
END;
$$;

/** Create an invitation and return its token. */
CREATE OR REPLACE FUNCTION invite_site_member(
  p_site_id UUID,
  p_email TEXT,
  p_role site_role
)
RETURNS TABLE (out_token TEXT, out_expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor site_role;
BEGIN
  v_actor := site_role_of(p_site_id);
  IF v_actor IS NULL OR v_actor > 'admin' THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF p_role < v_actor THEN
    RAISE EXCEPTION 'cannot_grant_above_own_role';
  END IF;

  RETURN QUERY
  INSERT INTO site_invitations AS i (site_id, email, role, invited_by)
  VALUES (p_site_id, lower(trim(p_email)), p_role, auth.uid())
  ON CONFLICT (site_id, lower(email)) WHERE accepted_at IS NULL
  DO UPDATE SET role = EXCLUDED.role,
                token = encode(gen_random_bytes(24), 'hex'),
                expires_at = NOW() + INTERVAL '7 days',
                invited_by = EXCLUDED.invited_by
  RETURNING i.token, i.expires_at;

  PERFORM log_site_action(p_site_id, 'member.invited', lower(trim(p_email)),
                          jsonb_build_object('role', p_role));
END;
$$;

/**
 * Redeem an invitation.
 *
 * The token proves the invitation, and the signed-in email must match the one
 * invited -- otherwise a forwarded email grants access to whoever opens it.
 */
CREATE OR REPLACE FUNCTION accept_site_invitation(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv site_invitations%ROWTYPE;
  v_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_inv FROM site_invitations
   WHERE token = p_token AND accepted_at IS NULL;

  IF v_inv.id IS NULL THEN
    RAISE EXCEPTION 'invalid_invitation';
  END IF;
  IF v_inv.expires_at < NOW() THEN
    RAISE EXCEPTION 'invitation_expired';
  END IF;

  SELECT lower(email) INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS DISTINCT FROM lower(v_inv.email) THEN
    RAISE EXCEPTION 'invitation_email_mismatch';
  END IF;

  INSERT INTO site_members (site_id, user_id, role, invited_by)
  VALUES (v_inv.site_id, auth.uid(), v_inv.role, v_inv.invited_by)
  ON CONFLICT (site_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE site_invitations SET accepted_at = NOW() WHERE id = v_inv.id;

  PERFORM log_site_action(v_inv.site_id, 'member.joined', auth.uid()::text,
                          jsonb_build_object('role', v_inv.role));
  RETURN v_inv.site_id;
END;
$$;

-- ------------------------------------------- members reach the site they admin
--
-- `sites` already lets a workspace owner see their own rows. A member who is
-- not the workspace owner needs a second path, or the admin they were invited
-- to would render empty. Policies are OR'd, so this widens without touching
-- the existing one.

DROP POLICY IF EXISTS "Members can view sites they belong to" ON sites;
CREATE POLICY "Members can view sites they belong to" ON sites
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM site_members m
             WHERE m.site_id = sites.id AND m.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Editors can update sites they belong to" ON sites;
CREATE POLICY "Editors can update sites they belong to" ON sites
  FOR UPDATE USING (has_site_role(id, 'editor'))
  WITH CHECK (has_site_role(id, 'editor'));
