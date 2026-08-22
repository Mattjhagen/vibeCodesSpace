/**
 * Porkbun registrar client. Replaces dynadot.ts (2026-08-22) — same public
 * interface (checkAvailability / registerDomain / isRegisteredToUs) so every
 * caller (search route, Stripe webhook) changes only its import.
 *
 * ⚠️ UNVERIFIED AGAINST THE LIVE API. Written from Porkbun's published v3.15
 * docs (https://porkbun.com/api/json/v3/documentation), not probed against a
 * running key the way dynadot.ts was (see docs/ADR-002, "written against the
 * live API rather than from memory"). Porkbun's classic `checkDomain`
 * response shape (avail/price/regularPrice/premium) is long-stable and
 * well-documented publicly, but has not been hit with a real sandbox key from
 * this codebase. Get a `pk1_sb_` sandbox key from
 * https://porkbun.com/account/api and run a real `checkDomain` +
 * `create ... dryRun:true` before this touches production traffic. Record any
 * field-name discrepancies here the way dynadot.ts did.
 *
 * Server-side only. Keys are account-scoped and can register/transfer
 * domains — never expose to a client bundle or a NEXT_PUBLIC_ variable.
 */

const PRODUCTION = 'https://api.porkbun.com/api/json/v3'

export class PorkbunError extends Error {
  constructor(public code: string, message: string) {
    super(message)
  }
}

type PorkbunResponse = {
  status?: string
  message?: string
  [k: string]: unknown
}

/**
 * A `pk1_sb_`-prefixed API key runs the entire API against Porkbun's isolated
 * sandbox automatically — same base URL, no separate sandbox host the way
 * Dynadot has one. So there is nothing to toggle here beyond which key is
 * configured; `PORKBUN_ENV=production` is a belt-and-suspenders guard so a
 * misplaced sandbox key can never be mistaken for production, and vice versa.
 */
function assertKeyEnvMatches(apikey: string) {
  const isSandboxKey = apikey.startsWith('pk1_sb_')
  const wantsProduction = process.env.PORKBUN_ENV === 'production'
  if (isSandboxKey && wantsProduction) {
    throw new PorkbunError(
      'env_mismatch',
      'PORKBUN_ENV=production but PORKBUN_API_KEY is a sandbox (pk1_sb_) key.'
    )
  }
  if (!isSandboxKey && !wantsProduction) {
    throw new PorkbunError(
      'env_mismatch',
      'PORKBUN_API_KEY looks like a production key but PORKBUN_ENV is not "production". ' +
        'Set PORKBUN_ENV=production explicitly, or use a pk1_sb_ sandbox key.'
    )
  }
}

async function call(
  path: string,
  body: Record<string, unknown> = {},
  opts: { idempotencyKey?: string } = {}
): Promise<PorkbunResponse> {
  const apikey = process.env.PORKBUN_API_KEY
  const secretapikey = process.env.PORKBUN_SECRET_API_KEY
  if (!apikey || !secretapikey) {
    throw new PorkbunError('not_configured', 'Domain registration is not configured.')
  }
  assertKeyEnvMatches(apikey)

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey

  let res: Response
  try {
    res = await fetch(`${PRODUCTION}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ apikey, secretapikey, ...body }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch (err) {
    throw new PorkbunError('unreachable', `Could not reach the registrar: ${String(err)}`)
  }

  let payload: PorkbunResponse
  try {
    payload = (await res.json()) as PorkbunResponse
  } catch {
    throw new PorkbunError('malformed', 'Registrar returned an unreadable response.')
  }

  // Porkbun uses HTTP status correctly (unlike Dynadot's HTTP-200-with-error-
  // code quirk), but check status:"ERROR" too in case a future endpoint
  // doesn't set the HTTP code to match.
  if (!res.ok || payload.status === 'ERROR') {
    throw new PorkbunError(
      `http_${res.status}`,
      payload.message || `Registrar returned HTTP ${res.status}.`
    )
  }

  return payload
}

export interface Availability {
  domain: string
  available: boolean
  /** In whole currency units. Null when the registrar did not quote one. */
  priceUsd: number | null
  premium: boolean
}

/**
 * Availability and price.
 *
 * Called again immediately before purchase, never trusted from an earlier
 * lookup: both availability and price move, and a stale quote means either
 * charging the wrong amount or charging for a name someone else just took.
 */
export async function checkAvailability(domain: string): Promise<Availability> {
  const payload = await call(`/domain/checkDomain/${encodeURIComponent(domain)}`)

  // Documented shape is top-level `avail`/`price`/`regularPrice`/`premium`,
  // but nest defensively under `response` too — verify against sandbox.
  const r = (payload.response ?? payload) as Record<string, unknown>

  const availRaw = String(r.avail ?? '').toLowerCase()
  const priceRaw = String(r.price ?? r.regularPrice ?? '')
  const priceMatch = priceRaw.match(/[\d.]+/)

  return {
    domain,
    available: availRaw === 'yes' || availRaw === 'true',
    priceUsd: priceMatch ? Number(priceMatch[0]) : null,
    premium: String(r.premium ?? '').toLowerCase() === 'true' || String(r.premium ?? '').toLowerCase() === 'yes',
  }
}

export interface RegistrationResult {
  domain: string
  expiresOn: string | null
}

export interface RegistrantContact {
  firstName: string
  lastName: string
  email: string
  phone: string
  address1: string
  city: string
  state: string
  zip: string
  country: string
  organization?: string
}

/**
 * Register a domain.
 *
 * Deliberately has no retry, matching dynadot.ts: a registration is
 * effectively non-refundable to us, and a retry after an ambiguous failure
 * risks registering — and paying for — the same name twice. The caller
 * resolves ambiguity via isRegisteredToUs, not by trying again.
 *
 * ⚠️ KNOWN GAP, carried over unchanged from the Dynadot version: the Stripe
 * webhook currently calls this WITHOUT a registrantContact, so the domain
 * registers to Porkbun's account-default contact — the reseller model —
 * which is the opposite of what ADR-002 decided ("the customer is the
 * registrant of record"). Passing a real per-domain contact here is a
 * separate, larger feature: it needs a form to collect the customer's postal
 * address/phone, a DPA with Porkbun before the first real registration, and
 * ICANN-verification-email tracking (an unverified registrant suspends the
 * domain in 15 days). Do not treat this function's signature as proof that
 * ADR-002 is implemented — it isn't yet, on either registrar.
 */
export async function registerDomain(args: {
  domain: string
  years: number
  registrantContact?: RegistrantContact
  idempotencyKey?: string
}): Promise<RegistrationResult> {
  const body: Record<string, unknown> = {
    domain: args.domain,
    // Re-quote instead of trusting an earlier lookup — required by Porkbun's
    // create endpoint (cost must match the current quote, in integer cents)
    // and by our own "never trust a stale quote" rule (see ADR-002 #4).
    agreeToTerms: 'yes',
  }
  if (args.registrantContact) {
    const c = args.registrantContact
    body.registrant = {
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      address1: c.address1,
      city: c.city,
      state: c.state,
      zip: c.zip,
      country: c.country,
      organization: c.organization,
    }
  }

  // Re-check price/availability immediately before spending money — never
  // trust a quote from an earlier request (ADR-002 #4: both availability and
  // price move between lookup and purchase).
  const fresh = await checkAvailability(args.domain)
  if (!fresh.available || fresh.priceUsd == null) {
    throw new PorkbunError('unavailable', `${args.domain} is no longer available to register.`)
  }
  body.cost = Math.round(fresh.priceUsd * 100) // integer US cents, per Porkbun docs

  const payload = await call(
    `/domain/create/${encodeURIComponent(args.domain)}`,
    body,
    { idempotencyKey: args.idempotencyKey }
  )
  const r = (payload.response ?? payload) as Record<string, unknown>

  return {
    domain: args.domain,
    expiresOn: (r.expirationDate as string) ?? null,
  }
}

/**
 * Is the domain already in our account? Used to resolve an ambiguous failure.
 * ⚠️ Endpoint path is a best guess (`/domain/get/{domain}`, mirroring the
 * "Domains: ...list/manage every domain in the account" capability listed in
 * the docs overview) — the exact path was not in the fetched reference pages
 * and needs confirming against the OpenAPI spec (porkbun.com/api/json/v3/spec)
 * or a sandbox call before this is trusted for a real refund decision.
 */
export async function isRegisteredToUs(domain: string): Promise<boolean | null> {
  try {
    await call(`/domain/get/${encodeURIComponent(domain)}`)
    return true
  } catch (err) {
    if (err instanceof PorkbunError && err.code.startsWith('http_4')) return false
    // Unknown — the caller must not refund on this.
    return null
  }
}
