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
  premium: boolean
  buyUrl: string
  error?: boolean
}

// Namecheap logo mark — simple "N" wordmark using brand colors
function NamecheapMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect width="24" height="24" rx="4" fill="#DE3723"/>
      <path d="M6 18V6l5.5 8V6M12.5 6v12M12.5 6l5.5 12V6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Microsoft logo — four colored squares
function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022"/>
      <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00"/>
      <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
    </svg>
  )
}

const TLD_COLORS: Record<string, string> = {
  '.com': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  '.net': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  '.org': 'bg-green-500/10 text-green-600 dark:text-green-400',
  '.io':  'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  '.co':  'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  '.dev': 'bg-red-500/10 text-red-600 dark:text-red-400',
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
              {result.priceUsd != null ? `$${result.priceUsd.toFixed(2)}/yr` : '—'}
            </span>
            <a href={result.buyUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-1.5 bg-[#DE3723] hover:bg-[#c43220] text-white border-0">
                <NamecheapMark className="h-3.5 w-3.5" />
                Buy
                <svg className="h-3 w-3 opacity-70" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 10L10 2M10 2H5M10 2v5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </a>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Taken</span>
        )}
      </div>
    </div>
  )
}

// Set NEXT_PUBLIC_MICROSOFT_AFFILIATE_URL in Vercel env vars to your Impact
// tracking link once approved (impact.com → Microsoft 365 program).
// Falls back to the direct Microsoft 365 Business page if unset.
const MICROSOFT_URL =
  process.env.NEXT_PUBLIC_MICROSOFT_AFFILIATE_URL ||
  'https://www.microsoft.com/en-us/microsoft-365/business/compare-all-plans'

function Microsoft365Card({ domain }: { domain?: string }) {
  return (
    <div className="rounded-xl border border-[#0078D4]/20 bg-gradient-to-br from-[#0078D4]/5 via-background to-[#7FBA00]/5 px-5 py-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <MicrosoftIcon className="h-5 w-5 shrink-0" />
        <span className="font-semibold text-sm">Add business email with Microsoft 365</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Get{' '}
        <span className="font-mono text-foreground text-xs">
          {domain ? `you@${domain}` : 'you@yourdomain.com'}
        </span>{' '}
        with Microsoft 365 — includes Outlook, Teams, Word, Excel, and 1 TB OneDrive per user.
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">From $6/user/mo · 1-month free trial</span>
        <a href={MICROSOFT_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0 border-[#0078D4]/30 hover:border-[#0078D4]/60">
            <MicrosoftIcon className="h-3.5 w-3.5" />
            Get Microsoft 365
          </Button>
        </a>
      </div>
    </div>
  )
}

export default function DomainSearchPage() {
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
  // Best domain to suggest for Google Workspace — prefer .com if available
  const bestDomain = available.find((r) => r.domain.endsWith('.com'))?.domain ?? available[0]?.domain

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Get a custom domain</h1>
        <p className="text-sm text-muted-foreground">
          Search below, buy it on Namecheap, then come back and connect it to your site.
          Already own one?{' '}
          <Link href="/dashboard/domains/connect" className="text-primary hover:underline underline-offset-4">
            Connect it →
          </Link>
        </p>
      </div>

      {/* Search bar */}
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

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
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

          {/* Post-purchase connect prompt */}
          {available.length > 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Bought your domain?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connect it to your site from the dashboard — takes about 5 minutes.
                </p>
              </div>
              <Link href="/dashboard/domains/connect" className="shrink-0">
                <Button variant="outline" size="sm">
                  Connect a domain →
                </Button>
              </Link>
            </div>
          )}

          {/* Google Workspace upsell */}
          {available.length > 0 && (
            <Microsoft365Card domain={bestDomain} />
          )}
        </div>
      )}

      {/* Empty state */}
      {!results && !loading && !error && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center space-y-2">
          <div className="flex justify-center mb-3">
            <NamecheapMark className="h-8 w-8 opacity-40" />
          </div>
          <p className="text-sm font-medium text-foreground">Search for your domain above</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Type a name or a full domain like{' '}
            <span className="font-mono">mybusiness.com</span>. We'll check .com, .net, .org, .io, .co, and .dev.
          </p>
        </div>
      )}

      {/* Powered by callout */}
      <p className="text-center text-[11px] text-muted-foreground/60 flex items-center justify-center gap-1.5">
        Domain search powered by <NamecheapMark className="h-3.5 w-3.5 inline-block" /> Namecheap
      </p>
    </div>
  )
}
