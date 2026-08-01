-- Publishing: subdomain allocation, per-site suspension, abuse reports, and
-- the anonymous read path a published site needs.

-- ---------------------------------------------------------------- allocation
--
-- One registry row per name, so allocation is a single atomic statement rather
-- than check-then-insert (which races: two requests can both see "available"
-- before either writes). `name` is the primary key, so the database decides the
-- winner, not the application.
--
-- A released name keeps its row with `available_at` set in the future. Links,
-- QR codes and search results outlive a site, so instant re-claim would let a
-- stranger inherit an audience that still trusts the name -- a subdomain
-- takeover with extra steps.

CREATE TABLE IF NOT EXISTS subdomains (
  name TEXT PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  -- NULL while held; set to released_at + cooldown on release.
  available_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subdomains_site ON subdomains (site_id);
CREATE INDEX IF NOT EXISTS idx_subdomains_workspace ON subdomains (workspace_id);

ALTER TABLE subdomains ENABLE ROW LEVEL SECURITY;

-- Anyone may read the registry: resolving a hostname to a site is a public
-- operation, and name availability is discoverable by trying the URL anyway.
DROP POLICY IF EXISTS "Subdomain registry is publicly readable" ON subdomains;
CREATE POLICY "Subdomain registry is publicly readable" ON subdomains
  FOR SELECT USING (TRUE);

-- No INSERT/UPDATE/DELETE policies. RLS default-denies, so allocation happens
-- only through claim_subdomain() below, which is SECURITY DEFINER and applies
-- the ownership check itself. That keeps the atomic upsert in one place
-- instead of trusting every caller to get the race right.

/**
 * Claim a subdomain for a site. Returns the claimed name, or raises.
 *
 * Atomic by construction: the INSERT ... ON CONFLICT either wins the primary
 * key or updates a row whose cooldown has expired. Two concurrent callers
 * cannot both succeed.
 */
CREATE OR REPLACE FUNCTION claim_subdomain(p_site_id UUID, p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
  v_claimed TEXT;
BEGIN
  -- Ownership check, explicit because SECURITY DEFINER bypasses RLS.
  SELECT s.workspace_id INTO v_workspace_id
  FROM sites s
  JOIN workspaces w ON w.id = s.workspace_id
  WHERE s.id = p_site_id AND w.user_id = auth.uid();

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  INSERT INTO subdomains (name, site_id, workspace_id, claimed_at, released_at, available_at)
  VALUES (p_name, p_site_id, v_workspace_id, NOW(), NULL, NULL)
  ON CONFLICT (name) DO UPDATE
    SET site_id = EXCLUDED.site_id,
        workspace_id = EXCLUDED.workspace_id,
        claimed_at = NOW(),
        released_at = NULL,
        available_at = NULL
    WHERE subdomains.available_at IS NOT NULL
      AND subdomains.available_at <= NOW()
  RETURNING name INTO v_claimed;

  IF v_claimed IS NULL THEN
    RAISE EXCEPTION 'subdomain_taken';
  END IF;

  UPDATE sites SET subdomain = p_name WHERE id = p_site_id;
  RETURN v_claimed;
END;
$$;

/** Release a subdomain, starting its cooldown. */
CREATE OR REPLACE FUNCTION release_subdomain(p_site_id UUID, p_cooldown_days INT DEFAULT 30)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM sites s JOIN workspaces w ON w.id = s.workspace_id
    WHERE s.id = p_site_id AND w.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  UPDATE subdomains
     SET released_at = NOW(),
         available_at = NOW() + (p_cooldown_days || ' days')::INTERVAL,
         site_id = NULL
   WHERE site_id = p_site_id;

  UPDATE sites SET subdomain = NULL WHERE id = p_site_id;
END;
$$;

-- --------------------------------------------------------------- suspension
--
-- Per-SITE, deliberately not per-account: taking down one phishing page must
-- not require disabling a customer who has five legitimate sites, and leaving
-- it up while the account is investigated is not an option either.

ALTER TABLE sites ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- ------------------------------------------------------------ anon read path
--
-- Until now `sites` had no SELECT policy for anonymous users, so a published
-- site could not be read by a visitor -- publishing was structurally
-- impossible regardless of routing. This grants exactly the rows a visitor
-- needs: published, not suspended. Draft and suspended sites stay invisible.

DROP POLICY IF EXISTS "Published sites are publicly readable" ON sites;
CREATE POLICY "Published sites are publicly readable" ON sites
  FOR SELECT
  USING (status = 'published' AND suspended_at IS NULL);

-- ----------------------------------------------------------- abuse reports
--
-- A launch requirement, not polish: a phishing page on any subdomain can get
-- the apex blocklisted by Safe Browsing, which kills every customer site and
-- the domain's email deliverability at once.

CREATE TABLE IF NOT EXISTS abuse_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain TEXT,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  details TEXT NOT NULL,
  reporter_email TEXT,
  -- Coarse, for rate limiting only.
  reporter_ip_hash TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abuse_reports_status_created
  ON abuse_reports (status, created_at DESC);

ALTER TABLE abuse_reports ENABLE ROW LEVEL SECURITY;

-- Anyone, signed in or not, may file a report. Requiring an account to report
-- phishing means the reports do not arrive.
DROP POLICY IF EXISTS "Anyone can file an abuse report" ON abuse_reports;
CREATE POLICY "Anyone can file an abuse report" ON abuse_reports
  FOR INSERT WITH CHECK (TRUE);

-- Deliberately no SELECT policy: reports are triage material and can name
-- third parties. They are read with the service role, not by users.

-- ------------------------------------------------- site creation rate limit
--
-- Bulk site creation is how a phishing operation gets scale out of one signup.

CREATE TABLE IF NOT EXISTS site_creation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_creation_workspace_created
  ON site_creation_events (workspace_id, created_at DESC);

ALTER TABLE site_creation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own site creation events" ON site_creation_events;
CREATE POLICY "Users can view their own site creation events" ON site_creation_events
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can record their own site creation events" ON site_creation_events;
CREATE POLICY "Users can record their own site creation events" ON site_creation_events
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
