'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type DomainResult = {
  domain: string
  available: boolean
  priceUsd: number | null
  finalPrice: number | null
  premium: boolean
  error?: boolean
}

const TLD_COLORS: Record<string, string> = {
  '.com': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  '.net': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  '.org': 'bg-green-500/10 text-green-600 dark:text-green-400',
  '.io':  'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  '.co':  'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  '.dev': 'bg-red-500/10 text-red-600 dark:text-red-400',
}

function BuyButton({ domain, finalPrice, priceUsd }: { domain: string; finalPrice: number | null; priceUsd: number | null }) {
  const [loading, setLoading] = useState(false)

  async function handleBuy() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/domain-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          finalPrice,
          baseCost: priceUsd != null ? Math.round(priceUsd * 100) : 0,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleBuy}
      disabled={loading || finalPrice == null}
      className="gap-1.5"
    >
      {loading ? (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
      ) : 'Buy'}
    </Button>
  )
}

function DomainRow({ result }: { result: DomainResult }) {
  const dot = result.domain.lastIndexOf('.')
  const name = result.domain.slice(0, dot)
  const tld = result.domain.slice(dot)
  const colorCls = TLD_COLORS[tld] ?? 'bg-muted text-muted-foreground'

  return (
    <div className={cn(
      'flex items-center justify-between gap-4 rounded-xl border px-5 py-4 transition',
      result.available
        ? 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
        : 'border-border/40 bg-muted/20 opacity-55',
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn('inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold', colorCls)}>
          {tld}
        </span>
        <span className="font-mono text-sm font-medium truncate">
          {name}<span className="text-muted-foreground">{tld}</span>
        </span>
        {result.premium && (
          <span className="hidden sm:inline-flex shrink-0 items-center rounded-full border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            PREMIUM
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {result.available ? (
          <>
            <span className="hidden sm:block text-sm font-semibold tabular-nums text-foreground">
              {result.finalPrice != null ? `$${result.finalPrice.toFixed(2)}/yr` : '—'}
            </span>
            <BuyButton domain={result.domain} finalPrice={result.finalPrice} priceUsd={result.priceUsd} />
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Taken</span>
        )}
      </div>
    </div>
  )
}

const ZOHO_URL =
  process.env.NEXT_PUBLIC_ZOHO_AFFILIATE_URL ||
  'https://www.zoho.com/mail/zohomail-pricing.html'

function ZohoMailCard({ domain }: { domain?: string }) {
  return (
    <div className="rounded-xl border border-[#E42527]/20 bg-gradient-to-br from-[#E42527]/5 via-background to-[#F5A623]/5 px-5 py-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
          <rect width="24" height="24" rx="3" fill="#E42527"/>
          <path d="M4 7l8 5 8-5M4 7v10h16V7M4 7h16" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
        </svg>
        <span className="font-semibold text-sm">Add business email with Zoho Mail</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Get{' '}
        <span className="font-mono text-foreground text-xs">
          {domain ? `you@${domain}` : 'you@yourdomain.com'}
        </span>{' '}
        with Zoho Mail — ad-free business email with 5 GB per user, calendar, and contacts included.
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">From $1/user/mo · free plan available</span>
        <a href={ZOHO_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0 border-[#E42527]/30 hover:border-[#E42527]/60">
            Get Zoho Mail
          </Button>
        </a>
      </div>
    </div>
  )
}

export function DomainsPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DomainResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function search() {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setResults(null)
    setError(null)
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResults(data.results)
    } catch {
      setError('Could not reach the domain search service. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const available = results?.filter((r) => r.available) ?? []
  const taken = results?.filter((r) => !r.available) ?? []
  const bestDomain = available.find((r) => r.domain.endsWith('.com'))?.domain ?? available[0]?.domain

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Get a custom domain</h1>
        <p className="text-sm text-muted-foreground">
          Search for a domain and register it directly — no leaving the app.
          Already own one?{' '}
          <Link href="/dashboard/domains/connect" className="text-primary hover:underline underline-offset-4">
            Connect it →
          </Link>
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder={`mybusiness.com  or just "mybusiness"`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          className="h-11 font-mono"
          autoFocus
        />
        <Button
          onClick={search}
          disabled={loading || !query.trim()}
          className="h-11 px-6 shrink-0"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          ) : 'Search'}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {available.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Available
              </p>
              <div className="space-y-2">
                {available.map((r) => <DomainRow key={r.domain} result={r} />)}
              </div>
            </section>
          )}

          {taken.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Not available
              </p>
              <div className="space-y-2">
                {taken.map((r) => <DomainRow key={r.domain} result={r} />)}
              </div>
            </section>
          )}

          {available.length > 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Already own a domain?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connect an existing domain to your site from here.
                </p>
              </div>
              <Link href="/dashboard/domains/connect" className="shrink-0">
                <Button variant="outline" size="sm">
                  Connect a domain →
                </Button>
              </Link>
            </div>
          )}

          {available.length > 0 && (
            <ZohoMailCard domain={bestDomain} />
          )}
        </div>
      )}

      {!results && !loading && !error && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">Search for your domain above</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Type a name or a full domain like{' '}
            <span className="font-mono">mybusiness.com</span>. We'll check .com, .net, .org, .io, .co, and .dev.
          </p>
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground/60">
        Domain registration powered by Dynadot
      </p>
    </div>
  )
}
