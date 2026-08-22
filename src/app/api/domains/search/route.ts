import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkAvailability } from '@/lib/porkbun'

const DEFAULT_TLDS = ['.com', '.net', '.org', '.io', '.co', '.dev']

// Passed through at Porkbun's wholesale price, no markup — decided 2026-08-22.

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

  const settled = await Promise.allSettled(domains.map((d) => checkAvailability(d)))

  const results = settled.map((r, i) => {
    if (r.status === 'fulfilled') {
      const { domain, available, priceUsd, premium } = r.value
      return {
        domain,
        available,
        priceUsd,
        // finalPrice is what we charge the customer — equal to priceUsd since
        // there's no markup. Kept as a separate field so the UI and the
        // Stripe checkout line item don't need to change if that ever
        // reverses. Null when Porkbun did not quote a price (e.g.
        // unavailable or error).
        finalPrice: priceUsd,
        premium,
      }
    }
    return {
      domain: domains[i],
      available: false,
      priceUsd: null,
      finalPrice: null,
      premium: false,
      error: true,
    }
  })

  return NextResponse.json({ results })
}
