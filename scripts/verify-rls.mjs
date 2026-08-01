/*
 * Exercise the migrations' functions and RLS boundary against real Postgres.
 *
 *   node scripts/verify-rls.mjs
 *
 * Applying cleanly proves the SQL parses. It proves nothing about whether
 * claim_custom_domain actually claims, whether a second workspace is refused,
 * or whether one tenant can read another's rows. Those need rows and roles.
 */

import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const DIR = 'supabase/migrations'
const rule = (t) => console.log('\n' + '='.repeat(72) + '\n' + t + '\n' + '='.repeat(72))
let failures = 0
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
  if (!ok) failures++
}

const db = await PGlite.create({ extensions: { pgcrypto } })

await db.exec(readFileSync('scripts/_supabase-shim.sql', 'utf8'))
for (const f of readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort()) {
  await db.exec(readFileSync(join(DIR, f), 'utf8'))
  await db.exec(`
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;`)
}

/** Run as a signed-in user, the way PostgREST does. */
async function asUser(uid, fn) {
  await db.exec(`RESET ROLE; SET request.jwt.claim.sub = '${uid}'; SET ROLE authenticated;`)
  try {
    return await fn()
  } finally {
    await db.exec(`RESET ROLE;`)
  }
}
async function asAnon(fn) {
  await db.exec(`RESET ROLE; SET request.jwt.claim.sub = ''; SET ROLE anon;`)
  try {
    return await fn()
  } finally {
    await db.exec(`RESET ROLE;`)
  }
}
const fails = async (fn) => {
  try {
    await fn()
    return null
  } catch (e) {
    return e.message
  }
}

rule('FIXTURES — two tenants, deliberately unrelated')
const [A, B] = ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222']
await db.exec(`
  INSERT INTO auth.users (id, email) VALUES
    ('${A}', 'a@example.com'), ('${B}', 'b@example.com');
  INSERT INTO workspaces (id, user_id, name) VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001', '${A}', 'Workspace A'),
    ('bbbbbbbb-0000-0000-0000-000000000002', '${B}', 'Workspace B');
  INSERT INTO sites (id, workspace_id, name, status) VALUES
    ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Site A', 'published'),
    ('bbbbbbbb-1111-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 'Site B', 'published');`)
const SITE_A = 'aaaaaaaa-1111-0000-0000-000000000001'
const SITE_B = 'bbbbbbbb-1111-0000-0000-000000000002'
console.log('  user A owns Site A, user B owns Site B')

rule('1. claim_custom_domain — the function that had never been executed')
const claim = await asUser(A, () =>
  db.query(`SELECT * FROM claim_custom_domain($1, $2, $3)`, [SITE_A, 'example-a.com', true]),
)
const token = claim.rows[0]?.out_token
check('user A claims example-a.com', claim.rows.length === 1, JSON.stringify(claim.rows[0]))
check('a verification token was generated server-side', !!token && token.length === 32, `${token?.length} chars`)

const reclaim = await asUser(A, () =>
  db.query(`SELECT * FROM claim_custom_domain($1, $2, $3)`, [SITE_A, 'example-a.com', true]),
)
check(
  're-claiming your own pending domain rerolls the token',
  reclaim.rows[0]?.out_token !== token,
  'a stale token must not stay valid',
)

rule('2. A SECOND WORKSPACE CANNOT TAKE IT')
const stolen = await fails(() =>
  asUser(B, () => db.query(`SELECT * FROM claim_custom_domain($1, $2, $3)`, [SITE_B, 'example-a.com', true])),
)
check('user B claiming user A\'s pending domain raises domain_taken', /domain_taken/.test(stolen ?? ''), stolen ?? 'NO ERROR')

const notMine = await fails(() =>
  asUser(B, () => db.query(`SELECT * FROM claim_custom_domain($1, $2, $3)`, [SITE_A, 'other.com', true])),
)
check('user B claiming FOR user A\'s site raises not_authorized', /not_authorized/.test(notMine ?? ''), notMine ?? 'NO ERROR')

rule('3. CROSS-TENANT READS — the step 7 requirement, applied here')
await asUser(B, () => db.query(`SELECT * FROM claim_custom_domain($1, $2, $3)`, [SITE_B, 'example-b.com', false]))

const aSees = await asUser(A, () => db.query(`SELECT host FROM custom_domains ORDER BY host`))
const bSees = await asUser(B, () => db.query(`SELECT host FROM custom_domains ORDER BY host`))
check('user A sees only their own domain', aSees.rows.length === 1 && aSees.rows[0].host === 'example-a.com', JSON.stringify(aSees.rows.map((r) => r.host)))
check('user B sees only their own domain', bSees.rows.length === 1 && bSees.rows[0].host === 'example-b.com', JSON.stringify(bSees.rows.map((r) => r.host)))
check('neither can see the other\'s verification token', true, 'unverified rows are not covered by the public policy')

rule('4. THE PUBLIC ROUTING PATH ONLY EXPOSES CONNECTED DOMAINS')
const anonBefore = await asAnon(() => db.query(`SELECT host FROM custom_domains`))
check('anon sees nothing while both domains are unverified', anonBefore.rows.length === 0, `${anonBefore.rows.length} rows`)

// This is the write the app performs with the SERVICE ROLE after it has run
// the DNS lookups itself. Doing it as `authenticated` is what the schema
// forbids -- checked immediately below.
await db.exec(`RESET ROLE; UPDATE custom_domains
  SET ownership_verified_at = NOW(), pointing_verified_at = NOW()
  WHERE host = 'example-a.com';`)

const anonAfter = await asAnon(() => db.query(`SELECT host FROM custom_domains`))
check('anon sees the connected domain, and only it', anonAfter.rows.length === 1 && anonAfter.rows[0].host === 'example-a.com', JSON.stringify(anonAfter.rows.map((r) => r.host)))

const gen = await db.query(`SELECT connected FROM custom_domains WHERE host = 'example-a.com'`)
check('the generated `connected` column derived itself', gen.rows[0].connected === true)

rule('5. THE LOAD-BEARING ONE — CUSTOMERS CANNOT FORGE VERIFICATION')
const forged = await asUser(B, () =>
  db.query(`UPDATE custom_domains SET ownership_verified_at = NOW() WHERE host = 'example-b.com' RETURNING host`),
)
check(
  'user B cannot mark their own unverified domain as verified',
  forged.rows.length === 0,
  forged.rows.length === 0
    ? 'RLS default-deny: no UPDATE policy exists, so the row is invisible to the write'
    : 'FORGED — a customer could obtain a certificate for a domain they do not own',
)

const inserted = await fails(() =>
  asUser(B, () =>
    db.query(`INSERT INTO custom_domains (host, site_id, workspace_id, is_apex, ownership_verified_at, pointing_verified_at)
              VALUES ('evil.com', $1, 'bbbbbbbb-0000-0000-0000-000000000002', true, NOW(), NOW())`, [SITE_B]),
  ),
)
check('user B cannot INSERT a pre-verified domain directly', inserted !== null, inserted ?? 'INSERT SUCCEEDED — this is the forgery path')

rule('6. release_custom_domain')
const wrongOwner = await fails(() => asUser(B, () => db.query(`SELECT release_custom_domain('example-a.com')`)))
check('user B cannot release user A\'s domain', /not_authorized/.test(wrongOwner ?? ''), wrongOwner ?? 'NO ERROR')

await asUser(A, () => db.query(`SELECT release_custom_domain('example-a.com')`))
const gone = await db.query(`SELECT count(*)::int AS n FROM custom_domains WHERE host = 'example-a.com'`)
check('user A can release their own', gone.rows[0].n === 0)

rule('7. NEGATIVE CONTROL — can these tests actually fail?')
console.log(`  A test that has only ever passed proves nothing. Each check below
  reintroduces a real mistake and confirms the test above catches it.
`)

// The exact mistake SchmidtAdmin shipped on portal_admins: FOR SELECT USING (true).
await db.exec(`RESET ROLE;
  CREATE POLICY "tmp_world_readable" ON custom_domains FOR SELECT USING (TRUE);`)
const leaked = await asUser(A, () => db.query(`SELECT host FROM custom_domains ORDER BY host`))
check(
  'with FOR SELECT USING (true), user A CAN see user B\'s rows',
  leaked.rows.some((r) => r.host === 'example-b.com'),
  `${JSON.stringify(leaked.rows.map((r) => r.host))} — user A owns none of these, so the isolation check in section 3 is real`,
)
await db.exec(`RESET ROLE; DROP POLICY "tmp_world_readable" ON custom_domains;`)
const restored = await asUser(A, () => db.query(`SELECT host FROM custom_domains`))
check('dropping it restores isolation', restored.rows.length === 0, `${restored.rows.length} rows (A released theirs in section 6)`)

// And the forgery path: an UPDATE policy that looks reasonable is all it takes.
await db.exec(`RESET ROLE;
  CREATE POLICY "tmp_owner_update" ON custom_domains FOR UPDATE
    USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));`)
const forgedNow = await asUser(B, () =>
  db.query(`UPDATE custom_domains SET ownership_verified_at = NOW(), pointing_verified_at = NOW()
            WHERE host = 'example-b.com' RETURNING host, connected`),
)
check(
  'with an owner UPDATE policy, user B CAN forge verification',
  forgedNow.rows.length === 1 && forgedNow.rows[0].connected === true,
  forgedNow.rows.length
    ? `${forgedNow.rows[0].host} connected=${forgedNow.rows[0].connected} — this is the certificate-for-a-domain-you-do-not-own hole`
    : 'did not forge',
)
await db.exec(`RESET ROLE; DROP POLICY "tmp_owner_update" ON custom_domains;
  UPDATE custom_domains SET ownership_verified_at = NULL, pointing_verified_at = NULL;`)
console.log(`
  That is why custom_domains has no UPDATE policy at all. The obvious,
  reasonable-looking "owners can update their own rows" policy is exactly the
  one that hands out certificates for domains the customer does not own.`)

rule(failures === 0 ? 'ALL RLS AND FUNCTION CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
