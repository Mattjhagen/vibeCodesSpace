/**
 * Abuse reports. Deliberately unauthenticated.
 *
 * Requiring an account to report a phishing page means the reports do not
 * arrive — the people best placed to notice are the targets, not the customers.
 * The documented contact is abuse@vibecodes.space; this endpoint is the
 * machine-readable equivalent, and both are listed in /.well-known/security.txt.
 *
 * Rate limited by a coarse IP hash so the ledger cannot be flooded, and the
 * hash is salted and truncated because "who reported this" is not something
 * worth retaining in identifiable form.
 */

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const CATEGORIES = ['phishing', 'malware', 'spam', 'illegal', 'impersonation', 'other']
const MAX_PER_HOUR = 20

function hashIp(req: Request): string {
  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ??
    ''
  const salt = process.env.ABUSE_IP_SALT ?? 'vibecodes-abuse'
  return createHash('sha256').update(salt + ip).digest('hex').slice(0, 32)
}

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Malformed request body.' }, { status: 400 })
  }

  const subdomain = String(body.subdomain ?? '').trim().toLowerCase().slice(0, 63)
  const category = String(body.category ?? '').trim().toLowerCase()
  const details = String(body.details ?? '').trim().slice(0, 4000)
  const reporterEmail = String(body.reporter_email ?? '').trim().slice(0, 200)

  if (!CATEGORIES.includes(category)) {
    return Response.json(
      { error: `category must be one of: ${CATEGORIES.join(', ')}` },
      { status: 400 },
    )
  }
  if (details.length < 10) {
    return Response.json(
      { error: 'Please describe the problem in at least a sentence.' },
      { status: 400 },
    )
  }

  const supabase = anonClient()
  const ipHash = hashIp(req)

  const { count } = await supabase
    .from('abuse_reports')
    .select('id', { count: 'exact', head: true })
    .eq('reporter_ip_hash', ipHash)
    .gte('created_at', new Date(Date.now() - 3_600_000).toISOString())

  if ((count ?? 0) >= MAX_PER_HOUR) {
    return Response.json({ error: 'Too many reports. Try again later.' }, { status: 429 })
  }

  // Resolve the subdomain to a site if we can, but never fail the report
  // because of it — a report about a site that has already been taken down is
  // still worth having.
  let siteId: string | null = null
  if (subdomain) {
    const { data } = await supabase
      .from('subdomains')
      .select('site_id')
      .eq('name', subdomain)
      .maybeSingle()
    siteId = data?.site_id ?? null
  }

  const { error } = await supabase.from('abuse_reports').insert({
    subdomain: subdomain || null,
    site_id: siteId,
    category,
    details,
    reporter_email: reporterEmail || null,
    reporter_ip_hash: ipHash,
  })

  if (error) {
    console.error('[abuse] failed to record report', error.message)
    return Response.json({ error: 'Could not file the report. Please email abuse@vibecodes.space.' }, { status: 500 })
  }

  return Response.json({ ok: true, contact: 'abuse@vibecodes.space' }, { status: 202 })
}

export async function GET() {
  return Response.json({
    contact: 'abuse@vibecodes.space',
    categories: CATEGORIES,
    how_to_report: 'POST { subdomain, category, details, reporter_email? } to this endpoint.',
  })
}
