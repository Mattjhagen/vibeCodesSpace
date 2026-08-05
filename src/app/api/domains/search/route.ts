import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkAvailability } from '@/lib/dynadot'

const DEFAULT_TLDS = ['.com', '.net', '.org', '.io', '.co', '.dev']

/**
 * Builds a Namecheap affiliate buy URL.
 *
 * Namecheap's affiliate program runs on Impact. Set NAMECHEAP_AFFILIATE_ID to
 * your Impact publisher ID — the full tracking URL becomes:
 *   https://namecheap.pxf.io/c/{id}/1383/1383?u=https://www.namecheap.com/...
 *
 * Leave NAMECHEAP_AFFILIATE_ID unset to link directly (no tracking, no commission).
 */
function namecheapBuyUrl(domain: string): string {
  const dest = `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(domain)}`
  const affId = process.env.NAMECHEAP_AFFILIATE_ID
  if (!affId) return dest
  return `https://namecheap.pxf.io/c/${affId}/1383/1383?u=${encodeURIComponent(dest)}`
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = new URL(req.url).searchParams.get('q')?.trim().toLowerCase()
  if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 })

  const clean = q.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '')
  const hasTld = /\.[a-z]{2,}$/.test(clean)
  const domains = hasTld
    ? [clean]
    : DEFAULT_TLDS.map((tld) => clean.replace(/\..+$/, '') + tld)

  // Dynadot handles the availability check; Namecheap handles the purchase.
  // Domain availability data is identical across registrars (it's all WHOIS).
  // This avoids Namecheap's API IP-whitelisting requirement on serverless infra.
  const settled = await Promise.allSettled(domains.map((d) => checkAvailability(d)))

  const results = settled.map((r, i) =>
    r.status === 'fulfilled'
      ? { ...r.value, buyUrl: namecheapBuyUrl(domains[i]) }
      : { domain: domains[i], available: false, priceUsd: null, premium: false, buyUrl: namecheapBuyUrl(domains[i]), error: true },
  )

  return NextResponse.json({ results })
}
