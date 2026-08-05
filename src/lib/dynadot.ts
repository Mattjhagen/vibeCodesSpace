/**
 * Dynadot registrar client.
 *
 * Written against the live API rather than from memory or from the docs alone.
 * Two things the probe turned up that the documentation does not match:
 *
 *  - The docs describe a `SuccessCode` field; the live JSON endpoint returns
 *    `ResponseCode`. Both are accepted below, because a client that only reads
 *    the documented name treats every real response as malformed.
 *  - Errors come back as HTTP 200 with `ResponseCode: "-1"`. Checking
 *    `res.ok` alone would read "invalid key" as a successful registration.
 *
 * Server-side only. The key is account-scoped — it can register and transfer
 * domains, so it must never reach a client bundle or a NEXT_PUBLIC_ variable.
 */

const PRODUCTION = 'https://api.dynadot.com/api3.json'
const SANDBOX = 'https://api-sandbox.dynadot.com/api3.json'

export function dynadotEndpoint(): string {
  // Opt IN to production. Having DYNADOT_PRODUCTION_KEY set (vs DYNADOT_API_KEY)
  // also implies production — a key named "production" is unlikely to be for sandbox.
  const useProduction =
    process.env.DYNADOT_ENV === 'production' ||
    (!!process.env.DYNADOT_PRODUCTION_KEY && !process.env.DYNADOT_API_KEY)
  return useProduction ? PRODUCTION : SANDBOX
}

export class DynadotError extends Error {
  constructor(public code: string, message: string) {
    super(message)
  }
}

type DynadotResponse = {
  Response?: {
    ResponseCode?: string
    SuccessCode?: string
    Error?: string
    Status?: string
    [k: string]: unknown
  }
  [k: string]: unknown
}

async function call(params: Record<string, string>): Promise<DynadotResponse['Response']> {
  // Accept either name — DYNADOT_PRODUCTION_KEY is used in the Vercel/local env,
  // DYNADOT_API_KEY is the legacy name retained for backward compatibility.
  const key = process.env.DYNADOT_PRODUCTION_KEY || process.env.DYNADOT_API_KEY
  if (!key) throw new DynadotError('not_configured', 'Domain registration is not configured.')

  const url = new URL(dynadotEndpoint())
  url.searchParams.set('key', key)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  let res: Response
  try {
    res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(30_000) })
  } catch (err) {
    throw new DynadotError('unreachable', `Could not reach the registrar: ${String(err)}`)
  }

  if (!res.ok) {
    throw new DynadotError(`http_${res.status}`, `Registrar returned HTTP ${res.status}.`)
  }

  const body = (await res.json()) as DynadotResponse
  const payload = body.Response ?? (body as DynadotResponse['Response'])
  if (!payload) throw new DynadotError('malformed', 'Registrar returned an unreadable response.')

  // Errors arrive as HTTP 200. This is the check that matters.
  const code = payload.ResponseCode ?? payload.SuccessCode
  if (code !== undefined && code !== '0') {
    throw new DynadotError(
      'registrar_error',
      String(payload.Error ?? 'The registrar rejected the request.'),
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
  const payload = await call({
    command: 'search',
    domain0: domain,
    show_price: '1',
    currency: 'USD',
  })

  const results = (payload?.SearchResults ?? payload?.searchResults) as
    | Array<Record<string, unknown>>
    | undefined
  const first = results?.[0] ?? {}

  const availableRaw = String(first.Available ?? first.available ?? '').toLowerCase()
  const priceRaw = String(first.Price ?? first.price ?? '')
  const priceMatch = priceRaw.match(/[\d.]+/)

  return {
    domain,
    available: availableRaw === 'yes' || availableRaw === 'true',
    priceUsd: priceMatch ? Number(priceMatch[0]) : null,
    premium: String(first.IsPremium ?? '').toLowerCase() === 'yes',
  }
}

export interface RegistrationResult {
  domain: string
  expiresOn: string | null
}

/**
 * Register a domain.
 *
 * Deliberately has no retry. A registration is effectively non-refundable to
 * us, and a retry after an ambiguous failure risks registering — and paying
 * for — the same name twice. The caller resolves ambiguity by re-checking
 * availability, not by trying again.
 */
export async function registerDomain(args: {
  domain: string
  years: number
  registrantContactId?: string
}): Promise<RegistrationResult> {
  const params: Record<string, string> = {
    command: 'register',
    domain: args.domain,
    duration: String(args.years),
    currency: 'USD',
  }
  // Omitted means the account's default contact is used — which is the
  // reseller model. See docs/ADR-002-domain-registrant.md.
  if (args.registrantContactId) params.registrant_contact = args.registrantContactId

  const payload = await call(params)
  const reg = (payload?.RegisterResponse ?? payload) as Record<string, unknown>
  return {
    domain: args.domain,
    expiresOn: (reg?.ExpirationDate as string) ?? null,
  }
}

/** Is the domain already in our account? Used to resolve an ambiguous failure. */
export async function isRegisteredToUs(domain: string): Promise<boolean | null> {
  try {
    const payload = await call({ command: 'domain_info', domain })
    return Boolean(payload)
  } catch (err) {
    if (err instanceof DynadotError && err.code === 'registrar_error') return false
    // Unknown — the caller must not refund on this.
    return null
  }
}
