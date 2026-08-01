/*
 * Custom-domain verification, exercised against REAL DNS.
 *
 *   npx tsx --tsconfig tsconfig.verify.json scripts/verify-custom-domain.ts
 *
 * Uses live public domains so the failure reasons are produced by real
 * resolver behaviour, not by mocks that assert what I already believe.
 */

import { promises as dnsPromises } from 'dns'
import {
  APEX_A_RECORDS,
  CNAME_TARGET,
  dnsInstructions,
  normalizeCustomDomain,
  verifyDomain,
  verifyOwnership,
  verifyPointing,
} from '../src/lib/custom-domain'
import { customDomainFromHost, tenantFromHost } from '../src/proxy'

const rule = (t: string) => console.log('\n' + '='.repeat(72) + '\n' + t + '\n' + '='.repeat(72))
let failures = 0
const check = (label: string, ok: boolean, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
  if (!ok) failures++
}
/**
 * For things that are wrong in the ENVIRONMENT rather than in the code.
 * Kept out of the exit code deliberately: this script answers "does the
 * verification logic work", and a DNS record nobody has created yet must not
 * make that question look unanswered.
 */
let warnings = 0
const warn = (label: string, ok: boolean, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'WARN'}  ${label}${detail ? '  — ' + detail : ''}`)
  if (!ok) warnings++
}

async function main() {
  rule('1. NORMALISATION')
  const norm: [string, string | false][] = [
    ['example.com', 'example.com'],
    ['https://www.example.com/pricing', 'www.example.com'],
    ['  EXAMPLE.COM.  ', 'example.com'],
    ['1.2.3.4', false],
    ['not a domain', false],
    ['thing.local', false],
    ['alice.vibecodes.space', false],
    ['vibecodes.space', false],
  ]
  for (const [input, expected] of norm) {
    const r = normalizeCustomDomain(input)
    if (expected === false) {
      check(`rejects ${JSON.stringify(input)}`, !r.ok, r.ok ? `ACCEPTED as ${r.host}` : r.reason)
    } else {
      check(`${JSON.stringify(input)} → ${expected}`, r.ok && r.host === expected, r.ok ? r.host : r.reason)
    }
  }

  rule('2. APEX vs SUBDOMAIN INSTRUCTIONS')
  const apex = normalizeCustomDomain('example.com')
  const sub = normalizeCustomDomain('www.example.com')
  if (apex.ok && sub.ok) {
    check('example.com detected as apex', apex.isApex)
    check('www.example.com detected as subdomain', !sub.isApex)
    console.log('\n  apex instructions:', JSON.stringify(dnsInstructions(apex.host, true, 'TOKEN123').pointing))
    console.log('  sub  instructions:', JSON.stringify(dnsInstructions(sub.host, false, 'TOKEN123').pointing))
    console.log('  ownership record  :', JSON.stringify(dnsInstructions(apex.host, true, 'TOKEN123').ownership))
  }

  rule('3. REAL DNS — DISTINCT FAILURE REASONS')

  const nx = await verifyOwnership('this-domain-really-does-not-exist-9c8f2z.com', 'tok')
  check('non-existent domain → nxdomain', nx.reason === 'nxdomain', nx.reason)
  console.log(`        ${nx.detail}`)

  const noRec = await verifyOwnership('purepulse.one', 'tok')
  check('real domain, no verification record → no_record', noRec.reason === 'no_record', noRec.reason)
  console.log(`        ${noRec.detail}`)

  const wrongTarget = await verifyPointing('www.iana.org', false)
  check(
    'real subdomain pointing elsewhere → wrong_target',
    wrongTarget.reason === 'wrong_target',
    wrongTarget.reason,
  )
  console.log(`        ${wrongTarget.detail}`)

  const apexElsewhere = await verifyPointing('iana.org', true)
  check(
    'real apex pointing elsewhere → wrong_target',
    apexElsewhere.reason === 'wrong_target',
    apexElsewhere.reason,
  )
  console.log(`        ${apexElsewhere.detail}`)

  const noCname = await verifyPointing('nonexistent-sub-9c8f2z.purepulse.one', false)
  check(
    'missing subdomain → nxdomain or no_record (not a generic failure)',
    noCname.reason === 'nxdomain' || noCname.reason === 'no_record',
    noCname.reason,
  )
  console.log(`        ${noCname.detail}`)

  rule('4. ORDERING — POINTING IS NOT CHECKED UNTIL OWNERSHIP PASSES')
  const status = await verifyDomain('purepulse.one', true, 'tok')
  check('ownership fails', !status.ownership.verified, status.ownership.reason)
  check('pointing reported as not-yet-checked', status.pointing.reason === 'unavailable', status.pointing.reason)
  check('certificate not attempted', !status.readyForCertificate)
  console.log(`
  Ownership is checked first on purpose. A domain already pointing at us
  proves nothing about who controls it — including a dangling record someone
  else left behind — and issuing a certificate for an unconfirmed domain is
  worse than refusing to.`)

  rule('5. THE CNAME TARGET WE HAND OUT')
  console.log(`  subdomains → CNAME ${CNAME_TARGET}`)

  // Whether the target actually resolves yet, asked rather than assumed — and
  // then whether it resolves for the RIGHT reason, which is a different
  // question. A wildcard makes every name resolve, so "it resolves" is not
  // evidence that anyone provisioned it.
  const resolveOrNull = async (name: string) => {
    try {
      return await dnsPromises.resolve(name)
    } catch {
      return null
    }
  }
  const target = await resolveOrNull(CNAME_TARGET)
  const decoy = await resolveOrNull('random-9c8f2z-probe.vibecodes.space')
  console.log(`  ${CNAME_TARGET} → ${JSON.stringify(target)}`)
  console.log(`  random-9c8f2z-probe.vibecodes.space → ${JSON.stringify(decoy)}`)

  const wildcarded =
    target !== null && decoy !== null && JSON.stringify([...target].sort()) === JSON.stringify([...decoy].sort())
  warn(
    'CNAME target has a DEDICATED record (not just the wildcard)',
    !wildcarded,
    wildcarded
      ? 'a random label resolves identically — this is *.vibecodes.space, not a provisioned target'
      : '',
  )
  console.log(`  apex customers are sent to  : ${JSON.stringify(APEX_A_RECORDS)}`)
  console.log(`  subdomain customers reach   : ${JSON.stringify(target)}`)
  console.log(`
  These are different destinations. The apex value is Vercel's anycast
  address; the CNAME target resolves into Cloudflare. At most one of the two
  is correct, and a CNAME into a Cloudflare zone that has never heard of
  example.com answers 1014/1016 rather than serving the site. Set
  CUSTOM_DOMAIN_CNAME_TARGET once the hosting path is settled.`)

  rule('6. HOST ROUTING — WHICH REQUESTS REACH THE CUSTOM-DOMAIN PATH')
  const routing: [string, 'app' | 'tenant' | 'custom'][] = [
    ['vibecodes.space', 'app'],
    ['www.vibecodes.space', 'app'],
    ['localhost:3000', 'app'],
    ['vibecodes-space.vercel.app', 'app'],
    ['alice.vibecodes.space', 'tenant'],
    ['admin.vibecodes.space', 'app'],          // reserved: not a tenant, not custom
    ['a.b.vibecodes.space', 'app'],            // wildcard cert covers one level only
    ['example.com', 'custom'],
    ['www.example.com', 'custom'],
    ['shop.example.co.uk', 'custom'],
    ['192.0.2.10', 'app'],                     // bare IP is never a customer domain
  ]
  for (const [host, expected] of routing) {
    const tenant = tenantFromHost(host)
    const custom = customDomainFromHost(host)
    const got = tenant ? 'tenant' : custom ? 'custom' : 'app'
    check(`${host} → ${got}`, got === expected, got === expected ? '' : `expected ${expected}`)
  }

  check(
    'a host is never classified as both tenant and custom',
    routing.every(([h]) => !(tenantFromHost(h) && customDomainFromHost(h))),
  )
  console.log(`
  Note the two "app" answers that are not obvious. admin.vibecodes.space is a
  RESERVED label, so it must not fall through to the custom-domain path — that
  would turn every blocked subdomain into a connectable hostname. And
  a.b.vibecodes.space is refused because the wildcard certificate covers
  exactly one level, so a deeper name would be served without a valid cert.`)

  rule(
    (failures === 0 ? 'ALL CUSTOM-DOMAIN CHECKS PASSED' : `${failures} CHECK(S) FAILED`) +
      (warnings > 0 ? ` — ${warnings} ENVIRONMENT WARNING(S), see above` : ''),
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => { console.error('verification failed:', e); process.exit(1) })
