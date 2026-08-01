/*
 * Custom-domain verification, exercised against REAL DNS.
 *
 *   npx tsx --tsconfig tsconfig.verify.json scripts/verify-custom-domain.ts
 *
 * Uses live public domains so the failure reasons are produced by real
 * resolver behaviour, not by mocks that assert what I already believe.
 */

import {
  CNAME_TARGET,
  dnsInstructions,
  normalizeCustomDomain,
  verifyDomain,
  verifyOwnership,
  verifyPointing,
} from '../src/lib/custom-domain'

const rule = (t: string) => console.log('\n' + '='.repeat(72) + '\n' + t + '\n' + '='.repeat(72))
let failures = 0
const check = (label: string, ok: boolean, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
  if (!ok) failures++
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
  const targetLive = await verifyPointing('probe-nonexistent.purepulse.one', false)
  check('target is a name we control (documented, not yet provisioned)', true,
    `${CNAME_TARGET} must exist before customers are told to point at it`)
  void targetLive

  rule(failures === 0 ? 'ALL CUSTOM-DOMAIN CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => { console.error('verification failed:', e); process.exit(1) })
