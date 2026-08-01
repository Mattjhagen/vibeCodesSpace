-- Connecting a domain the customer already owns.
--
-- `sites.custom_domain` already existed as a bare TEXT column with no state
-- attached, which is enough to *display* a domain and not enough to connect
-- one: connecting needs a verification token, two independent check results,
-- and a certificate status. That state lives here; `sites.custom_domain` stays
-- as the denormalised pointer to the connected host, maintained by the
-- functions below, exactly as `sites.subdomain` mirrors the `subdomains`
-- registry.

CREATE TABLE IF NOT EXISTS custom_domains (
  host TEXT PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Apex domains cannot CNAME (RFC 1034), so they get A records instead and
  -- the instructions differ. Decided at claim time from the host itself.
  is_apex BOOLEAN NOT NULL,

  -- Generated here, never supplied by the caller. A token the claimant chooses
  -- is a token they can also publish somewhere convenient.
  verification_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),

  -- The two questions, answered independently because they fail differently
  -- and have different fixes.
  ownership_verified_at TIMESTAMPTZ,
  pointing_verified_at TIMESTAMPTZ,

  -- pending | issuing | issued | failed
  certificate_status TEXT NOT NULL DEFAULT 'pending',
  certificate_detail TEXT,

  -- Last check, kept for the UI so the page can say *why* without re-running
  -- DNS on every render.
  last_checked_at TIMESTAMPTZ,
  last_reason TEXT,
  last_detail TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- "Connected" is derived, never stored independently: two sources of truth
  -- for whether a domain is live is how a domain ends up serving with one of
  -- them stale.
  connected BOOLEAN GENERATED ALWAYS AS (
    ownership_verified_at IS NOT NULL AND pointing_verified_at IS NOT NULL
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_site ON custom_domains (site_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_workspace ON custom_domains (workspace_id);

ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------- reading
--
-- Owners see their own claims, including unverified ones, because that is the
-- screen showing them which record to add.

DROP POLICY IF EXISTS "Owners can view their own custom domains" ON custom_domains;
CREATE POLICY "Owners can view their own custom domains" ON custom_domains
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- Connected domains are publicly readable so a request arriving on
-- `example.com` can be resolved to a site without an authenticated session.
-- This exposes host -> site_id for domains that already resolve here, which is
-- observable by loading the site anyway. Unverified claims stay private: they
-- carry a token, and a token an attacker can read is a token they can publish.
--
-- Note this does NOT make the site itself readable. `sites` has its own policy
-- (published AND NOT suspended), so a custom domain on a draft or suspended
-- site resolves to a row here and then to nothing.
DROP POLICY IF EXISTS "Connected custom domains are publicly readable" ON custom_domains;
CREATE POLICY "Connected custom domains are publicly readable" ON custom_domains
  FOR SELECT USING (connected);

-- ------------------------------------------------------------------- writing
--
-- No INSERT, UPDATE or DELETE policy exists, so RLS default-denies all three
-- to `authenticated` and `anon`. This is deliberate and load-bearing:
-- `ownership_verified_at` is the flag that authorises certificate issuance for
-- a hostname, so a customer who could write it could get a certificate issued
-- for a domain they do not own.
--
-- Claims and releases go through the SECURITY DEFINER functions below, which
-- apply their own ownership checks. Verification results are written with the
-- service role from the server, after the server itself has run the DNS
-- lookups -- see src/app/dashboard/domains/connect/actions.ts.

/**
 * Claim a host for a site. Returns the verification token to publish.
 *
 * Atomic by construction: `host` is the primary key, so two workspaces racing
 * for the same domain cannot both win.
 *
 * An UNVERIFIED claim expires after p_grace_days. Without that, claiming
 * `example.com` and never proving anything would permanently block the person
 * who actually owns it -- squatting the connect table rather than the DNS. A
 * CONNECTED claim never expires this way; it is released explicitly.
 */
CREATE OR REPLACE FUNCTION claim_custom_domain(
  p_site_id UUID,
  p_host TEXT,
  p_is_apex BOOLEAN,
  p_grace_days INT DEFAULT 7
)
-- Output columns are prefixed because in PL/pgSQL a RETURNS TABLE column
-- becomes a variable in scope, and `host` / `verification_token` are also
-- column names on the table being written — an ambiguous reference is a
-- runtime error, not a compile-time one.
RETURNS TABLE (out_host TEXT, out_token TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
BEGIN
  -- Explicit, because SECURITY DEFINER bypasses RLS.
  SELECT s.workspace_id INTO v_workspace_id
  FROM sites s
  JOIN workspaces w ON w.id = s.workspace_id
  WHERE s.id = p_site_id AND w.user_id = auth.uid();

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  INSERT INTO custom_domains AS cd (host, site_id, workspace_id, is_apex)
  VALUES (LOWER(p_host), p_site_id, v_workspace_id, p_is_apex)
  ON CONFLICT (host) DO UPDATE
    SET site_id = EXCLUDED.site_id,
        workspace_id = EXCLUDED.workspace_id,
        is_apex = EXCLUDED.is_apex,
        -- A fresh claim gets a fresh token: reusing the previous claimant's
        -- token would let them verify someone else's domain.
        verification_token = encode(gen_random_bytes(16), 'hex'),
        ownership_verified_at = NULL,
        pointing_verified_at = NULL,
        certificate_status = 'pending',
        certificate_detail = NULL,
        last_checked_at = NULL,
        last_reason = NULL,
        last_detail = NULL,
        created_at = NOW()
    WHERE
      -- Re-claiming your own pending claim is fine (it just re-rolls the
      -- token). Taking someone else's requires that theirs never verified and
      -- has gone stale.
      cd.workspace_id = v_workspace_id
      OR (NOT cd.connected AND cd.created_at < NOW() - (p_grace_days || ' days')::INTERVAL)
  RETURNING cd.host, cd.verification_token;
  -- NOTE: RETURN QUERY sets FOUND, which is what the guard below relies on.

  IF NOT FOUND THEN
    RAISE EXCEPTION 'domain_taken';
  END IF;
END;
$$;

/** Release a claim, clearing the site's pointer to it. */
CREATE OR REPLACE FUNCTION release_custom_domain(p_host TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site_id UUID;
BEGIN
  SELECT cd.site_id INTO v_site_id
  FROM custom_domains cd
  JOIN workspaces w ON w.id = cd.workspace_id
  WHERE cd.host = LOWER(p_host) AND w.user_id = auth.uid();

  IF v_site_id IS NULL THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  DELETE FROM custom_domains WHERE host = LOWER(p_host);

  UPDATE sites SET custom_domain = NULL
   WHERE id = v_site_id AND custom_domain = LOWER(p_host);
END;
$$;
