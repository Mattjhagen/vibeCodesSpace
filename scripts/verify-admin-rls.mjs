/*
 * The universal admin's security boundary, tested against real Postgres.
 *
 *   node scripts/verify-admin-rls.mjs
 *
 * Structured the way the step 7 brief asks for: for each isolation claim, show
 * the FAILING state first (policy absent, or replaced by the permissive one
 * SchmidtAdmin actually ships), then the PASSING state with the real policy in
 * place. A test that has only ever passed proves nothing -- it may be asserting
 * something that was never possible to violate.
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

// PGlite prints its entire minified bundle on an uncaught rejection, which
// buries the one line that matters.
process.on('unhandledRejection', (e) => {
  console.error('\n  UNEXPECTED: ' + (e?.message ?? e))
  process.exit(1)
})

const db = await PGlite.create({ extensions: { pgcrypto } })
await db.exec(readFileSync('scripts/_supabase-shim.sql', 'utf8'))
for (const f of readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort()) {
  await db.exec(readFileSync(join(DIR, f), 'utf8'))
  await db.exec(`
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;`)
}

const OWNER_A = '11111111-1111-1111-1111-111111111111'
const OWNER_B = '22222222-2222-2222-2222-222222222222'
const EDITOR_A = '33333333-3333-3333-3333-333333333333'
const ADMIN_A = '44444444-4444-4444-4444-444444444444'
const OUTSIDER = '55555555-5555-5555-5555-555555555555'
const SITE_A = 'aaaaaaaa-1111-0000-0000-000000000001'
const SITE_B = 'bbbbbbbb-1111-0000-0000-000000000002'

async function asUser(uid, fn) {
  await db.exec(`RESET ROLE; SET request.jwt.claim.sub = '${uid}'; SET ROLE authenticated;`)
  try { return await fn() } finally { await db.exec(`RESET ROLE;`) }
}
async function asAnon(fn) {
  await db.exec(`RESET ROLE; SET request.jwt.claim.sub = ''; SET ROLE anon;`)
  try { return await fn() } finally { await db.exec(`RESET ROLE;`) }
}
const fails = async (fn) => {
  try { await fn(); return null } catch (e) { return e.message }
}
/** Read as the table owner, bypassing RLS — for inspecting what actually landed. */
const sudo = async (sql, params = []) => {
  await db.exec('RESET ROLE;')
  return db.query(sql, params)
}

rule('FIXTURES')
await db.exec(`
  INSERT INTO auth.users (id, email) VALUES
    ('${OWNER_A}','ownera@example.com'), ('${OWNER_B}','ownerb@example.com'),
    ('${EDITOR_A}','editora@example.com'), ('${ADMIN_A}','admina@example.com'),
    ('${OUTSIDER}','outsider@example.com');
  INSERT INTO workspaces (id, user_id, name) VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001','${OWNER_A}','WS A'),
    ('bbbbbbbb-0000-0000-0000-000000000002','${OWNER_B}','WS B');
  INSERT INTO sites (id, workspace_id, name, status) VALUES
    ('${SITE_A}','aaaaaaaa-0000-0000-0000-000000000001','Site A','published'),
    ('${SITE_B}','bbbbbbbb-0000-0000-0000-000000000002','Site B','published');
  INSERT INTO site_members (site_id, user_id, role) VALUES
    ('${SITE_A}','${EDITOR_A}','editor'), ('${SITE_A}','${ADMIN_A}','admin');
  -- One submission and one audit entry per site, so "sees only their own" has
  -- something to actually get wrong.
  INSERT INTO form_submissions (site_id, payload) VALUES
    ('${SITE_A}', '{"name":"from site A"}'), ('${SITE_B}', '{"name":"from site B"}');
  INSERT INTO site_audit_log (site_id, actor_id, action) VALUES
    ('${SITE_A}','${OWNER_A}','site.published'), ('${SITE_B}','${OWNER_B}','site.published');
  INSERT INTO site_page_views (site_id, day, path, views) VALUES
    ('${SITE_A}', CURRENT_DATE, '/', 7), ('${SITE_B}', CURRENT_DATE, '/', 9);`)
console.log('  Site A: owner + admin + editor.  Site B: owner only.  Plus an outsider.')

// ---------------------------------------------------------------------------
rule('1. FORM SUBMISSIONS — FAILING FIRST (the permissive policy)')
console.log(`  Replacing the real policy with FOR SELECT USING (true) — the shape
  SchmidtAdmin ships on projects, proposals and proposal_line_items.
`)
await db.exec(`RESET ROLE;
  DROP POLICY "Members can read their site's submissions" ON form_submissions;
  CREATE POLICY "tmp_permissive" ON form_submissions FOR SELECT USING (TRUE);`)

let leak = await asUser(OWNER_B, () => db.query(`SELECT payload->>'name' AS n FROM form_submissions ORDER BY 1`))
check(
  'owner of site B reads site A\'s submissions',
  leak.rows.some((r) => r.n === 'from site A'),
  JSON.stringify(leak.rows.map((r) => r.n)) + '  <-- LEAK, as expected with USING (true)',
)
let anonLeak = await asAnon(() => db.query(`SELECT payload->>'name' AS n FROM form_submissions`))
check(
  'even an anonymous visitor reads every site\'s submissions',
  anonLeak.rows.length === 2,
  `${anonLeak.rows.length} rows  <-- LEAK`,
)

rule('1b. FORM SUBMISSIONS — PASSING (the real policy restored)')
await db.exec(`RESET ROLE;
  DROP POLICY "tmp_permissive" ON form_submissions;
  CREATE POLICY "Members can read their site's submissions" ON form_submissions
    FOR SELECT USING (has_site_role(site_id, 'viewer'));`)

const bSees = await asUser(OWNER_B, () => db.query(`SELECT payload->>'name' AS n FROM form_submissions`))
check('owner of site B sees only site B', bSees.rows.length === 1 && bSees.rows[0].n === 'from site B', JSON.stringify(bSees.rows.map((r) => r.n)))
const aSees = await asUser(OWNER_A, () => db.query(`SELECT payload->>'name' AS n FROM form_submissions`))
check('owner of site A sees only site A', aSees.rows.length === 1 && aSees.rows[0].n === 'from site A', JSON.stringify(aSees.rows.map((r) => r.n)))
const editorSees = await asUser(EDITOR_A, () => db.query(`SELECT payload->>'name' AS n FROM form_submissions`))
check('an invited editor sees site A, and nothing else', editorSees.rows.length === 1 && editorSees.rows[0].n === 'from site A', JSON.stringify(editorSees.rows.map((r) => r.n)))
const outsiderSees = await asUser(OUTSIDER, () => db.query(`SELECT * FROM form_submissions`))
check('a signed-in outsider sees nothing', outsiderSees.rows.length === 0, `${outsiderSees.rows.length} rows`)
const anonSees = await asAnon(() => db.query(`SELECT * FROM form_submissions`))
check('an anonymous visitor sees nothing', anonSees.rows.length === 0, `${anonSees.rows.length} rows`)

// ---------------------------------------------------------------------------
rule('2. AUDIT LOG — FAILING FIRST (SchmidtAdmin\'s exact insert policy)')
console.log(`  audit_logs there is FOR INSERT WITH CHECK (true). Adding the same
  policy here and letting an outsider forge an entry against a site they have
  nothing to do with, attributed to someone else.
`)
await db.exec(`RESET ROLE;
  CREATE POLICY "tmp_public_insert" ON site_audit_log FOR INSERT WITH CHECK (TRUE);`)
// No RETURNING: with RLS, RETURNING additionally requires a SELECT policy
// match, and the outsider has none. The write still lands -- which is worse,
// not better. They poison the log and cannot even be shown to have read it.
await asUser(OUTSIDER, () =>
  db.query(`INSERT INTO site_audit_log (site_id, actor_id, action, target)
            VALUES ($1, $2, 'site.deleted', 'forged by an outsider')`, [SITE_A, OWNER_A]),
)
const forged = await sudo(`SELECT actor_id FROM site_audit_log WHERE target = 'forged by an outsider'`)
check(
  'an outsider writes an audit entry blaming the owner',
  forged.rows.length === 1 && forged.rows[0].actor_id === OWNER_A,
  `entry landed, attributed to ${forged.rows[0]?.actor_id?.slice(0, 8)}…  <-- the log is now evidence of nothing`,
)

rule('2b. AUDIT LOG — PASSING (no insert policy at all)')
await db.exec(`RESET ROLE;
  DROP POLICY "tmp_public_insert" ON site_audit_log;
  DELETE FROM site_audit_log WHERE target = 'forged by an outsider';`)
const blocked = await fails(() =>
  asUser(OUTSIDER, () => db.query(`INSERT INTO site_audit_log (site_id, action) VALUES ($1,'site.deleted')`, [SITE_A])),
)
check('an outsider cannot write an entry', blocked !== null, blocked ?? 'INSERT SUCCEEDED')
const ownerBlocked = await fails(() =>
  asUser(OWNER_A, () => db.query(`INSERT INTO site_audit_log (site_id, action) VALUES ($1,'anything')`, [SITE_A])),
)
check('not even the site owner can write one directly', ownerBlocked !== null, ownerBlocked ?? 'INSERT SUCCEEDED')

await asUser(EDITOR_A, () => db.query(`SELECT log_site_action($1,'content.updated','page-1')`, [SITE_A]))
const stamped = await sudo(`SELECT actor_id, action FROM site_audit_log WHERE action='content.updated'`)
check(
  'log_site_action stamps actor_id from the session, not an argument',
  stamped.rows[0]?.actor_id === EDITOR_A,
  `actor_id=${stamped.rows[0]?.actor_id} — a caller cannot attribute an action to someone else`,
)
const outsiderLog = await fails(() => asUser(OUTSIDER, () => db.query(`SELECT log_site_action($1,'x')`, [SITE_A])))
check('an outsider cannot log against a site they do not belong to', /not_authorized/.test(outsiderLog ?? ''), outsiderLog ?? 'NO ERROR')

const editorReadsLog = await asUser(EDITOR_A, () => db.query(`SELECT * FROM site_audit_log`))
check('an editor cannot read the audit log (admin+ only)', editorReadsLog.rows.length === 0, `${editorReadsLog.rows.length} rows`)
const adminReadsLog = await asUser(ADMIN_A, () => db.query(`SELECT site_id FROM site_audit_log`))
check('an admin reads only their own site\'s log', adminReadsLog.rows.length > 0 && adminReadsLog.rows.every((r) => r.site_id === SITE_A), `${adminReadsLog.rows.length} rows, all site A`)

// ---------------------------------------------------------------------------
rule('3. THE ROLE MODEL — PRIVILEGE ESCALATION')
const escalate = await fails(() =>
  asUser(ADMIN_A, () => db.query(`SELECT set_site_member_role($1,$2,'owner')`, [SITE_A, ADMIN_A])),
)
check('an admin cannot promote anyone to owner', /cannot_grant_above_own_role/.test(escalate ?? ''), escalate ?? 'NO ERROR')

const editorGrants = await fails(() =>
  asUser(EDITOR_A, () => db.query(`SELECT set_site_member_role($1,$2,'editor')`, [SITE_A, OUTSIDER])),
)
check('an editor cannot grant roles at all', /not_authorized/.test(editorGrants ?? ''), editorGrants ?? 'NO ERROR')

const crossSite = await fails(() =>
  asUser(ADMIN_A, () => db.query(`SELECT set_site_member_role($1,$2,'editor')`, [SITE_B, OUTSIDER])),
)
check('an admin of site A cannot add members to site B', /not_authorized/.test(crossSite ?? ''), crossSite ?? 'NO ERROR')

await asUser(ADMIN_A, () => db.query(`SELECT set_site_member_role($1,$2,'viewer')`, [SITE_A, OUTSIDER]))
const nowMember = await asUser(OUTSIDER, () => db.query(`SELECT payload->>'name' AS n FROM form_submissions`))
check('a newly added viewer immediately sees site A only', nowMember.rows.length === 1 && nowMember.rows[0].n === 'from site A', JSON.stringify(nowMember.rows.map((r) => r.n)))

// The workspace owner has no site_members row at all -- site_role_of() derives
// 'owner' from workspace ownership -- so removal is a no-op rather than an
// error. Assert the outcome that matters: they are still the owner.
await asUser(ADMIN_A, () => db.query(`SELECT remove_site_member($1,$2)`, [SITE_A, OWNER_A]))
const stillOwner = await asUser(OWNER_A, () => db.query(`SELECT site_role_of($1) AS r`, [SITE_A]))
check('an admin cannot strip the workspace owner', stillOwner.rows[0].r === 'owner', `role is still ${stillOwner.rows[0].r}`)

// A SECOND owner, granted explicitly, does have a row -- and that is the case
// the guard has to catch.
await asUser(OWNER_A, () => db.query(`SELECT set_site_member_role($1,$2,'owner')`, [SITE_A, OUTSIDER]))
const removeOwner = await fails(() =>
  asUser(ADMIN_A, () => db.query(`SELECT remove_site_member($1,$2)`, [SITE_A, OUTSIDER])),
)
check('an admin cannot remove a co-owner', /cannot_remove_stronger_role/.test(removeOwner ?? ''), removeOwner ?? 'REMOVED — an admin could lock out an owner')
await asUser(OWNER_A, () => db.query(`SELECT set_site_member_role($1,$2,'viewer')`, [SITE_A, OUTSIDER]))

// Leaving a site you were invited to is legal, and exercises the ordering bug
// the audit log introduced: log_site_action authorises against your CURRENT
// role, so logging after the delete finds you are no longer a member.
const selfRemove = await fails(() =>
  asUser(ADMIN_A, () => db.query(`SELECT remove_site_member($1,$2)`, [SITE_A, ADMIN_A])),
)
check('an admin can remove themselves (leaving a site)', selfRemove === null, selfRemove ?? '')
const gone = await sudo(`SELECT count(*)::int AS n FROM site_members WHERE site_id=$1 AND user_id=$2`, [SITE_A, ADMIN_A])
check('and the membership row is actually gone, not rolled back', gone.rows[0].n === 0, `${gone.rows[0].n} rows`)

const directWrite = await fails(() =>
  asUser(EDITOR_A, () => db.query(`INSERT INTO site_members (site_id,user_id,role) VALUES ($1,$2,'owner')`, [SITE_A, EDITOR_A])),
)
check('an editor cannot bypass the functions and INSERT a membership row', directWrite !== null, directWrite ?? 'INSERT SUCCEEDED — escalation path')

const directUpdate = await asUser(EDITOR_A, () =>
  db.query(`UPDATE site_members SET role='owner' WHERE user_id=$1 RETURNING role`, [EDITOR_A]),
)
check('an editor cannot UPDATE their own role', directUpdate.rows.length === 0, directUpdate.rows.length ? 'ESCALATED' : 'no UPDATE policy exists')

// ---------------------------------------------------------------------------
rule('4. INVITATIONS')
const inv = await asUser(OWNER_A, () => db.query(`SELECT * FROM invite_site_member($1,'newperson@example.com','editor')`, [SITE_A]))
const token = inv.rows[0].out_token
check('owner creates an invitation with a token', !!token && token.length === 48, `${token?.length} hex chars`)

await db.exec(`RESET ROLE; INSERT INTO auth.users (id,email) VALUES ('66666666-6666-6666-6666-666666666666','wrong@example.com');`)
const mismatch = await fails(() =>
  asUser('66666666-6666-6666-6666-666666666666', () => db.query(`SELECT accept_site_invitation($1)`, [token])),
)
check('a forwarded invitation cannot be redeemed by a different address', /invitation_email_mismatch/.test(mismatch ?? ''), mismatch ?? 'ACCEPTED — anyone with the link joins')

await db.exec(`RESET ROLE; INSERT INTO auth.users (id,email) VALUES ('77777777-7777-7777-7777-777777777777','newperson@example.com');`)
const accepted = await asUser('77777777-7777-7777-7777-777777777777', () => db.query(`SELECT accept_site_invitation($1) AS site`, [token]))
check('the invited address can redeem it', accepted.rows[0].site === SITE_A)
const reuse = await fails(() => asUser('77777777-7777-7777-7777-777777777777', () => db.query(`SELECT accept_site_invitation($1)`, [token])))
check('a redeemed token cannot be reused', /invalid_invitation/.test(reuse ?? ''), reuse ?? 'REUSED')

const invLeak = await asUser(EDITOR_A, () => db.query(`SELECT * FROM site_invitations`))
check('an editor cannot read invitations (admin+ only)', invLeak.rows.length === 0, `${invLeak.rows.length} rows`)

// ---------------------------------------------------------------------------
rule('5. PUBLIC WRITE PATHS ARE SCOPED TO PUBLISHED SITES')
await db.exec(`RESET ROLE; UPDATE sites SET status='draft' WHERE id='${SITE_B}';`)
const toDraft = await fails(() =>
  asAnon(() => db.query(`INSERT INTO form_submissions (site_id,payload) VALUES ($1,'{"x":1}')`, [SITE_B])),
)
check('a visitor cannot submit to a DRAFT site', toDraft !== null, toDraft ?? 'INSERT SUCCEEDED')

await db.exec(`RESET ROLE; UPDATE sites SET status='published', suspended_at=NOW() WHERE id='${SITE_B}';`)
const toSuspended = await fails(() =>
  asAnon(() => db.query(`INSERT INTO form_submissions (site_id,payload) VALUES ($1,'{"x":1}')`, [SITE_B])),
)
check('a visitor cannot submit to a SUSPENDED site', toSuspended !== null, toSuspended ?? 'INSERT SUCCEEDED')

await db.exec(`RESET ROLE; UPDATE sites SET suspended_at=NULL WHERE id='${SITE_B}';`)
// No RETURNING: it would additionally require a SELECT policy match, and an
// anonymous submitter deliberately has none -- you can post to a contact form
// without being able to read the inbox.
const toPublished = await asAnon(() => db.query(`INSERT INTO form_submissions (site_id,payload) VALUES ($1,'{"x":1}')`, [SITE_B]))
check('a visitor CAN submit to a published site', toPublished.affectedRows === 1, `${toPublished.affectedRows} row inserted`)

const viewsBefore = await sudo(`SELECT views FROM site_page_views WHERE site_id='${SITE_A}' AND path='/'`)
await asAnon(() => db.query(`SELECT record_page_view($1,'/')`, [SITE_A]))
const viewsAfter = await sudo(`SELECT views FROM site_page_views WHERE site_id='${SITE_A}' AND path='/'`)
check('record_page_view increments for an anonymous visitor', viewsAfter.rows[0].views === viewsBefore.rows[0].views + 1, `${viewsBefore.rows[0].views} -> ${viewsAfter.rows[0].views}`)

const directView = await fails(() =>
  asAnon(() => db.query(`INSERT INTO site_page_views (site_id,day,path,views) VALUES ($1,CURRENT_DATE,'/fake',999999)`, [SITE_A])),
)
check('a visitor cannot write traffic counts directly', directView !== null, directView ?? 'INSERT SUCCEEDED — counts are forgeable')

const trafficLeak = await asUser(OWNER_B, () => db.query(`SELECT site_id FROM site_page_views`))
check('owner B cannot read site A\'s traffic', trafficLeak.rows.every((r) => r.site_id === SITE_B), JSON.stringify(trafficLeak.rows.map((r) => r.site_id)))

rule(failures === 0 ? 'ALL ADMIN RLS CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
