import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'

/**
 * Public endpoint behind a site's contact form.
 *
 * Reached from the tenant's own origin (`example.com/api/forms/<id>`), which
 * `proxy.ts` exempts from the tenant rewrite so it lands here rather than on
 * the site renderer.
 *
 * Deliberately unauthenticated and written through the ANON client, not the
 * service role: whether this submission is allowed is a question the database
 * should answer, and it does — the RLS insert policy requires the target site
 * to be published and not suspended. Using the service role here would bypass
 * that check and turn a guessed site id into free storage.
 */

const MAX_FIELDS = 25
const MAX_VALUE = 5000
const MAX_BODY = 64 * 1024

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * Coarse, one-way, and salted per site.
 *
 * Stored for rate limiting and abuse triage, never to identify a visitor. The
 * per-site salt means the same address on two different sites does not produce
 * the same hash, so the table cannot be used to correlate a person across
 * tenants.
 */
function hashIp(ip: string, siteId: string): string {
  const salt = process.env.SUBMISSION_IP_SALT ?? ''
  return createHash('sha256').update(`${salt}:${siteId}:${ip}`).digest('hex').slice(0, 32)
}

/** Keep the payload to flat, bounded, string-ish values. */
function sanitizePayload(input: unknown): Record<string, string> | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null
  const out: Record<string, string> = {}
  let n = 0
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (n >= MAX_FIELDS) break
    if (value === null || value === undefined) continue
    if (typeof value === 'object') continue // no nesting: it is a form, not a document
    out[key.slice(0, 100)] = String(value).slice(0, MAX_VALUE)
    n++
  }
  return out
}

export async function POST(req: Request, ctx: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await ctx.params

  if (!/^[0-9a-f-]{36}$/i.test(siteId)) {
    return NextResponse.json({ error: 'Unknown form.' }, { status: 404 })
  }

  const raw = await req.text()
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ error: 'Submission too large.' }, { status: 413 })
  }

  let parsed: unknown
  const contentType = req.headers.get('content-type') ?? ''
  try {
    parsed = contentType.includes('application/json')
      ? JSON.parse(raw)
      : Object.fromEntries(new URLSearchParams(raw))
  } catch {
    return NextResponse.json({ error: 'Could not read that submission.' }, { status: 400 })
  }

  const payload = sanitizePayload(parsed)
  if (!payload || Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Empty submission.' }, { status: 400 })
  }

  // A honeypot field, if the form includes one. Silently accepted so a bot
  // cannot distinguish rejection from success and retry differently.
  if (payload._gotcha) {
    return NextResponse.json({ ok: true })
  }
  delete payload._gotcha

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    ''

  const { error } = await anonClient().from('form_submissions').insert({
    site_id: siteId,
    block_id: typeof payload._block === 'string' ? payload._block.slice(0, 100) : null,
    page_slug: typeof payload._page === 'string' ? payload._page.slice(0, 200) : null,
    payload,
    submitter_ip_hash: ip ? hashIp(ip, siteId) : null,
  })

  if (error) {
    // The RLS policy refusing an unpublished or suspended site arrives here.
    // Do not distinguish it from a missing site: telling a prober which site
    // ids exist but are unpublished is free reconnaissance.
    console.warn('[forms] submission rejected', { siteId, code: error.code })
    return NextResponse.json({ error: 'This form is not accepting submissions.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
