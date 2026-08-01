/*
 * Run every migration against a real Postgres, in order, and report what breaks.
 *
 *   node scripts/verify-migrations.mjs
 *
 * PGlite is genuine PostgreSQL compiled to WASM, so DDL, PL/pgSQL, generated
 * columns and RLS all behave as they will on Supabase. What it is NOT is
 * Supabase: there is no `auth` schema, no `auth.uid()`, no `storage` schema,
 * and no `anon` / `authenticated` / `service_role` roles. The bootstrap below
 * creates those the way Supabase defines them, so the migrations run against
 * the same shape they will meet in production.
 *
 * The grants matter as much as the policies. On Supabase, `anon` and
 * `authenticated` hold table-level privileges and RLS narrows them. Without
 * reproducing that, every query would be refused by GRANT rather than by
 * policy, and an RLS test would pass for entirely the wrong reason.
 */

import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const DIR = 'supabase/migrations'

const BOOTSTRAP = readFileSync('scripts/_supabase-shim.sql', 'utf8')

/** Reproduce Supabase's default table grants; RLS is what narrows them. */
const GRANTS = `
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
`

const rule = (t) => console.log('\n' + '='.repeat(72) + '\n' + t + '\n' + '='.repeat(72))

const db = await PGlite.create({ extensions: { pgcrypto } })

rule('BOOTSTRAP — the Supabase shape PGlite does not ship with')
try {
  await db.exec(BOOTSTRAP)
  const v = (await db.query('SELECT version()')).rows[0].version
  console.log('  ok    ' + v.split(' on ')[0])
  console.log('  ok    roles anon / authenticated / service_role, auth.uid(), storage.*')
} catch (e) {
  console.error('  FAIL  bootstrap: ' + e.message)
  process.exit(1)
}

rule('MIGRATIONS — applied in filename order')
const files = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort()
let failed = 0

for (const f of files) {
  const sql = readFileSync(join(DIR, f), 'utf8')
  try {
    await db.exec(sql)
    await db.exec(GRANTS)
    console.log(`  ok    ${f}`)
  } catch (e) {
    failed++
    console.log(`  FAIL  ${f}`)
    console.log(`        ${e.message.split('\n').join('\n        ')}`)
    // Keep going: one broken migration should not hide the ones after it.
  }
}

rule('SCHEMA AFTER MIGRATION')
const tables = await db.query(`
  SELECT c.relname,
         c.relrowsecurity AS rls,
         (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policies
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY c.relname`)
console.log('  table                     RLS   policies')
for (const t of tables.rows) {
  const flag = t.rls ? 'on ' : 'OFF'
  const warn = !t.rls ? '   <-- NO RLS' : Number(t.policies) === 0 ? '   <-- RLS on, zero policies' : ''
  console.log(`  ${t.relname.padEnd(24)}  ${flag}   ${String(t.policies).padStart(2)}${warn}`)
}

const fns = await db.query(`
  SELECT p.proname, p.prosecdef
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' ORDER BY p.proname`)
console.log('\n  functions:')
for (const f of fns.rows) {
  console.log(`    ${f.proname}${f.prosecdef ? '  (SECURITY DEFINER)' : ''}`)
}

rule(failed === 0 ? 'ALL MIGRATIONS APPLIED CLEANLY' : `${failed} MIGRATION(S) FAILED`)
process.exit(failed === 0 ? 0 : 1)
