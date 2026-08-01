/*
 * Publishing verification. Run from the repo root:
 *
 *   npx tsx --tsconfig tsconfig.verify.json scripts/verify-publishing.ts
 */

import { RESERVED_NAMES, validateSubdomain } from '../src/lib/subdomain'
import { tenantFromHost } from '../src/proxy'
import { scanSite } from '../src/lib/abuse-scan'
import { parseSiteContent } from '../src/lib/content-model'
import { startingContent } from '../src/lib/site-types'

const rule = (t: string) => console.log('\n' + '='.repeat(72) + '\n' + t + '\n' + '='.repeat(72))
let failures = 0
const check = (label: string, ok: boolean, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
  if (!ok) failures++
}

rule('1. RESERVED AND BRAND NAMES ARE REJECTED')
for (const name of ['www', 'admin', 'paypal', 'api', 'mail', 'ns1', 'login', 'stripe', 'apple', 'secure-paypal', 'paypal-login']) {
  const r = validateSubdomain(name)
  check(`"${name}" rejected`, !r.ok, r.ok ? 'ACCEPTED' : `${r.reason}: ${r.message}`)
}

rule('2. SYNTAX RULES')
const syntax: [string, string][] = [
  ['ab', 'too_short'],
  ['a'.repeat(64), 'too_long'],
  ['has_underscore', 'invalid_characters'],
  ['has space', 'invalid_characters'],
  ['-leading', 'leading_hyphen'],
  ['trailing-', 'trailing_hyphen'],
  ['xn--80ak6aa92e', 'punycode_lookalike'],
  ['ab--cd', 'punycode_lookalike'],
  ['12345', 'all_numeric'],
]
for (const [name, expected] of syntax) {
  const r = validateSubdomain(name)
  check(`"${name}" → ${expected}`, !r.ok && r.reason === expected, r.ok ? 'ACCEPTED' : r.reason)
}

rule('2b. CASE IS NORMALISED, NOT REJECTED')
// DNS labels are case-insensitive, so uppercase input is normalised rather
// than refused. publish-action claims check.value, never the raw input.
const cased = validateSubdomain('Has-Caps')
check('"Has-Caps" normalises to "has-caps"', cased.ok && cased.value === 'has-caps',
  cased.ok ? cased.value : cased.reason)

rule('3. LEGITIMATE NAMES ARE ACCEPTED')
for (const name of ['harbour-vane-roofing', 'acme', 'jane-doe-design', 'studio42', 'a-b-c']) {
  const r = validateSubdomain(name)
  check(`"${name}" accepted`, r.ok, r.ok ? '' : `${r.reason}`)
}

rule('4. HOST → TENANT ROUTING (origin isolation depends on this)')
const hosts: [string, string | null][] = [
  ['alice.vibecodes.space', 'alice'],
  ['bob.vibecodes.space:443', 'bob'],
  ['ALICE.VIBECODES.SPACE', 'alice'],
  ['vibecodes.space', null],            // the app itself
  ['www.vibecodes.space', null],        // the app itself
  ['localhost:3000', null],             // dev
  ['deep.nested.vibecodes.space', null], // wildcard cert covers one level only
  ['admin.vibecodes.space', null],      // reserved
  ['evil.com', null],                   // foreign host
]
for (const [host, expected] of hosts) {
  const got = tenantFromHost(host)
  check(`${host.padEnd(30)} → ${expected ?? 'app (no tenant)'}`, got === expected, got === expected ? '' : `got ${got}`)
}

rule('5. EACH TENANT IS A DISTINCT ORIGIN')
const a = tenantFromHost('alice.vibecodes.space')
const b = tenantFromHost('bob.vibecodes.space')
check('alice and bob resolve to different tenants', a !== b, `${a} vs ${b}`)
check('neither resolves to the app host', tenantFromHost('vibecodes.space') === null)
console.log(`
  Browsers key cookies, localStorage, IndexedDB and service-worker scope to the
  ORIGIN (scheme + host + port). https://alice.vibecodes.space and
  https://bob.vibecodes.space are different hosts, therefore different origins,
  therefore separate storage — enforced by the browser, not by this code.
  Serving the same content at vibecodes.space/alice and /bob would put both in
  ONE origin alongside the logged-in app session.`)

rule('6. ABUSE SCAN')
const clean = startingContent('services', 'Harbour & Vane Roofing')
const cleanScan = scanSite(clean)
check('an ordinary services site is clean', cleanScan.verdict === 'clean', `score ${cleanScan.score}`)

const phishing = parseSiteContent({
  version: 2, siteType: 'business', theme: 'minimal',
  pages: [{ slug: '', title: 'PayPal Security', sections: [{ variant: 'plain', blocks: [
    { type: 'heading', level: 1, text: 'Your PayPal account has been suspended' },
    { type: 'text', text: 'Unusual activity was detected. Verify your account and confirm your password within 24 hours or your account will be permanently closed.' },
    { type: 'button', label: 'Verify now', href: 'https://paypal-secure-verify.example.com/login' },
  ] }] }],
})
const phishScan = scanSite(phishing)
check('a phishing page is blocked', phishScan.verdict === 'blocked', `score ${phishScan.score}`)
for (const r of phishScan.reasons) console.log(`        · ${r}`)

const borderline = parseSiteContent({
  version: 2, siteType: 'business', theme: 'minimal',
  pages: [{ slug: '', title: 'Acme', sections: [{ variant: 'plain', blocks: [
    { type: 'heading', level: 1, text: 'Acme Consulting' },
    { type: 'text', text: 'We help teams migrate off Google Workspace.' },
    { type: 'button', label: 'Read our blog', href: 'https://medium.com/@acme' },
  ] }] }],
})
const borderScan = scanSite(borderline)
check(
  'a legitimate brand mention is not blocked',
  borderScan.verdict !== 'blocked',
  `${borderScan.verdict} (score ${borderScan.score})`,
)

rule('7. RESERVED LIST COVERAGE')
for (const critical of ['www', 'api', 'admin', 'mail', 'mx', 'ns1', 'login', 'auth', 'billing', 'secure', 'support', 'status', 'cdn', 'static', 'assets', 'blog', 'docs', 'dev', 'staging', 'test']) {
  if (!RESERVED_NAMES.has(critical)) { check(`"${critical}" in reserved list`, false); }
}
check(`all task-specified reserved names present (${RESERVED_NAMES.size} total)`, true)

rule(failures === 0 ? 'ALL PUBLISHING CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
