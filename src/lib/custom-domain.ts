/**
 * Connecting a domain the customer already owns.
 *
 * Two separate questions, deliberately kept apart because they fail for
 * different reasons and have different fixes:
 *
 *   1. OWNERSHIP — do they control this domain?  (a TXT record they publish)
 *   2. POINTING  — does it actually route here?  (CNAME, or A records at apex)
 *
 * Checking only (2) would let anyone attach a domain that already points at us
 * — including a dangling record left by someone else — and inherit it.
 * Checking only (1) would mark a domain "connected" that serves nothing.
 *
 * Failure reasons are specific on purpose. "Verification failed" tells an
 * owner nothing: NXDOMAIN means they typed it wrong or the zone is dead,
 * no_record means they have not added it yet, wrong_target means they added it
 * pointing somewhere else, and propagating means they did everything right and
 * should wait. Those are four different actions.
 *
 * This is the same design as Shaggoth's ownership verification, ported per
 * ADR-001 rather than reinvented.
 */

import { promises as dns } from 'dns'

/** Where a subdomain should CNAME. */
export const CNAME_TARGET = 'cname.vibecodes.space'

/** Apex domains cannot CNAME (RFC 1034), so they need A records instead. */
export const APEX_A_RECORDS = ['76.76.21.21']

export const TXT_PREFIX = 'vibecodes-verify='

export type DomainRejection =
  | 'empty' | 'not_a_domain' | 'ip_address' | 'reserved_tld'
  | 'own_domain' | 'too_long'

export type DomainCheck =
  | { ok: true; host: string; isApex: boolean }
  | { ok: false; reason: DomainRejection; message: string }

const ROOT_DOMAIN = 'vibecodes.space'

/** Normalise a pasted domain and reject what cannot be connected. */
export function normalizeCustomDomain(raw: string): DomainCheck {
  let value = (raw ?? '').trim().toLowerCase()
  if (!value) return { ok: false, reason: 'empty', message: 'Enter a domain name.' }

  // Accept a pasted URL.
  value = value.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, '')
  if (value.includes('@')) value = value.split('@').pop()!

  if (value.length > 253) {
    return { ok: false, reason: 'too_long', message: 'That domain name is too long.' }
  }
  if (/^[0-9.]+$/.test(value) || value.includes(':')) {
    return { ok: false, reason: 'ip_address', message: 'Enter a domain name, not an IP address.' }
  }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(value)) {
    return { ok: false, reason: 'not_a_domain', message: `"${value}" is not a valid domain name.` }
  }
  if (/\.(local|internal|test|invalid|localhost|example)$/.test(value)) {
    return { ok: false, reason: 'reserved_tld', message: `"${value}" is not a public domain.` }
  }
  // Connecting a vibecodes.space name as a "custom" domain would collide with
  // subdomain allocation and route in a loop.
  if (value === ROOT_DOMAIN || value.endsWith(`.${ROOT_DOMAIN}`)) {
    return {
      ok: false, reason: 'own_domain',
      message: 'That is already a vibecodes.space address — choose a subdomain instead.',
    }
  }

  // Two labels = apex (example.com); more = subdomain (www.example.com).
  // Deliberately naive about multi-part suffixes (.co.uk): getting this wrong
  // only changes which instructions we show, and showing A records for
  // example.co.uk is correct anyway since it is an apex in practice.
  const isApex = value.split('.').length === 2
  return { ok: true, host: value, isApex }
}

export function dnsInstructions(host: string, isApex: boolean, token: string) {
  return {
    ownership: { type: 'TXT', name: `_vibecodes.${host}`, value: `${TXT_PREFIX}${token}` },
    pointing: isApex
      ? { type: 'A', name: host, values: APEX_A_RECORDS }
      : { type: 'CNAME', name: host, values: [CNAME_TARGET] },
  }
}

export type VerifyReason =
  | 'ok' | 'nxdomain' | 'no_record' | 'wrong_value' | 'wrong_target'
  | 'propagating' | 'servfail' | 'timeout' | 'unavailable'

export interface VerifyResult {
  verified: boolean
  reason: VerifyReason
  detail: string
  found: string[]
}

/** Map node:dns error codes onto our reasons. */
function fromDnsError(err: unknown): { reason: VerifyReason; detail: string } | null {
  const code = (err as NodeJS.ErrnoException)?.code
  switch (code) {
    case 'ENOTFOUND':
    case 'ENODATA':
      return null // caller distinguishes: the name may exist without this type
    case 'ESERVFAIL':
      return {
        reason: 'servfail',
        detail: 'The nameservers returned an error. This is a problem at the DNS provider, not with the record.',
      }
    case 'ETIMEOUT':
    case 'ETIMEDOUT':
      return { reason: 'timeout', detail: 'The DNS lookup timed out. This is usually temporary — try again.' }
    default:
      return null
  }
}

/** Does the zone exist at all? Separates "typo / dead domain" from "no record yet". */
async function zoneExists(host: string): Promise<boolean> {
  for (const probe of [host, host.split('.').slice(-2).join('.')]) {
    try {
      await dns.resolveNs(probe)
      return true
    } catch {
      /* try the registrable domain next */
    }
  }
  try {
    await dns.resolveAny(host)
    return true
  } catch {
    return false
  }
}

/** Step 1: does the owner control the domain? */
export async function verifyOwnership(host: string, token: string): Promise<VerifyResult> {
  const want = `${TXT_PREFIX}${token}`
  const name = `_vibecodes.${host}`

  let records: string[][] = []
  try {
    records = await dns.resolveTxt(name)
  } catch (err) {
    const mapped = fromDnsError(err)
    if (mapped) return { verified: false, ...mapped, found: [] }

    if (!(await zoneExists(host))) {
      return {
        verified: false, reason: 'nxdomain', found: [],
        detail: `${host} does not resolve. Check the spelling and that the domain's DNS is live.`,
      }
    }
    return {
      verified: false, reason: 'no_record', found: [],
      detail: `No TXT record found at ${name}. Add it, then check again — DNS changes can take a few minutes.`,
    }
  }

  const found = records.map((chunks) => chunks.join(''))
  if (found.includes(want)) {
    return { verified: true, reason: 'ok', detail: 'Ownership verified.', found }
  }
  const ours = found.filter((f) => f.startsWith(TXT_PREFIX))
  if (ours.length) {
    return {
      verified: false, reason: 'wrong_value', found: ours,
      detail: 'A verification record exists but its value does not match. Replace it with the exact value shown.',
    }
  }
  return {
    verified: false, reason: 'no_record', found,
    detail: `${name} has TXT records, but none is the verification record.`,
  }
}

/** Step 2: does the domain actually route here? */
export async function verifyPointing(host: string, isApex: boolean): Promise<VerifyResult> {
  if (!isApex) {
    let cnames: string[] = []
    try {
      cnames = await dns.resolveCname(host)
    } catch (err) {
      const mapped = fromDnsError(err)
      if (mapped) return { verified: false, ...mapped, found: [] }

      // No CNAME. An A record here means they pointed it the apex way, which
      // works but is not what we asked for — say so specifically.
      try {
        const a = await dns.resolve4(host)
        if (a.some((ip) => APEX_A_RECORDS.includes(ip))) {
          return { verified: true, reason: 'ok', detail: 'Domain is pointing here via A record.', found: a }
        }
        return {
          verified: false, reason: 'wrong_target', found: a,
          detail: `${host} has A records pointing at ${a.join(', ')}, not at us. Replace them with a CNAME to ${CNAME_TARGET}.`,
        }
      } catch {
        if (!(await zoneExists(host))) {
          return {
            verified: false, reason: 'nxdomain', found: [],
            detail: `${host} does not resolve. Check the spelling and that the domain's DNS is live.`,
          }
        }
        return {
          verified: false, reason: 'no_record', found: [],
          detail: `No CNAME record found for ${host}. Add a CNAME pointing at ${CNAME_TARGET}.`,
        }
      }
    }

    const normalized = cnames.map((c) => c.replace(/\.$/, '').toLowerCase())
    if (normalized.includes(CNAME_TARGET)) {
      return { verified: true, reason: 'ok', detail: 'Domain is pointing here.', found: normalized }
    }
    return {
      verified: false, reason: 'wrong_target', found: normalized,
      detail: `${host} points at ${normalized.join(', ')} instead of ${CNAME_TARGET}.`,
    }
  }

  // Apex: A records.
  let addresses: string[] = []
  try {
    addresses = await dns.resolve4(host)
  } catch (err) {
    const mapped = fromDnsError(err)
    if (mapped) return { verified: false, ...mapped, found: [] }
    if (!(await zoneExists(host))) {
      return {
        verified: false, reason: 'nxdomain', found: [],
        detail: `${host} does not resolve. Check the spelling and that the domain's DNS is live.`,
      }
    }
    return {
      verified: false, reason: 'no_record', found: [],
      detail: `No A record found for ${host}. Add A records pointing at ${APEX_A_RECORDS.join(', ')}.`,
    }
  }

  const matching = addresses.filter((ip) => APEX_A_RECORDS.includes(ip))
  if (matching.length === APEX_A_RECORDS.length) {
    return { verified: true, reason: 'ok', detail: 'Domain is pointing here.', found: addresses }
  }
  if (matching.length > 0) {
    // Some right, some wrong: almost always a half-finished edit rather than a
    // mistake, so name it as propagation rather than an error.
    return {
      verified: false, reason: 'propagating', found: addresses,
      detail: `${host} points at some of the right addresses but not all of them (${addresses.join(', ')}). This usually resolves within a few minutes.`,
    }
  }
  return {
    verified: false, reason: 'wrong_target', found: addresses,
    detail: `${host} points at ${addresses.join(', ')}, not at us. Replace the A records with ${APEX_A_RECORDS.join(', ')}.`,
  }
}

export interface DomainStatus {
  ownership: VerifyResult
  pointing: VerifyResult
  /** Certificate issuance is only attempted once both pass. */
  readyForCertificate: boolean
}

export async function verifyDomain(host: string, isApex: boolean, token: string): Promise<DomainStatus> {
  // Ownership first: pointing at us without owning it proves nothing, and
  // issuing a certificate for a domain we have not confirmed is worse.
  const ownership = await verifyOwnership(host, token)
  const pointing = ownership.verified
    ? await verifyPointing(host, isApex)
    : { verified: false, reason: 'unavailable' as const, detail: 'Not checked until ownership is verified.', found: [] }

  return { ownership, pointing, readyForCertificate: ownership.verified && pointing.verified }
}
