import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkAvailability } from '@/lib/dynadot'

const DEFAULT_TLDS = ['.com', '.net', '.org', '.io', '.co', '.dev']

function buyUrl(domain: string): string {
  const code = process.env.DYNADOT_AFFILIATE_CODE
  const url = new URL('https://www.dynadot.com/domain/search.html')
  url.searchParams.set('domain', domain)
  if (code) url.searchParams.set('refer', code)
  return url.toString()
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = new URL(req.url).searchParams.get('q')?.trim().toLowerCase()
  if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 })

  // Strip protocol/www and trailing slash
  const clean = q.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '')
  // If user typed a full domain with TLD, search just that; otherwise fan out across TLDs.
  const hasTld = /\.[a-z]{2,}$/.test(clean)
  const domains = hasTld
    ? [clean]
    : DEFAULT_TLDS.map((tld) => clean.replace(/\..+$/, '') + tld)

  const settled = await Promise.allSettled(domains.map((d) => checkAvailability(d)))

  const results = settled.map((r, i) =>
    r.status === 'fulfilled'
      ? { ...r.value, buyUrl: buyUrl(domains[i]) }
      : { domain: domains[i], available: false, priceUsd: null, premium: false, buyUrl: buyUrl(domains[i]), error: true },
  )

  return NextResponse.json({ results })
}
