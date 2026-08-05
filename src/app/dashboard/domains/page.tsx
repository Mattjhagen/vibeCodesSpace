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

function TldBadge({ tld }: { tld: string }) {
  const colors: Record<string, string> = {
    '.com': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    '.net': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    '.org': 'bg-green-500/10 text-green-600 dark:text-green-400',
    '.io':  'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    '.co':  'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    '.dev': 'bg-red-500/10 text-red-600 dark:text-red-400',
  }
  const cls = colors[tld] ?? 'bg-muted text-muted-foreground'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', cls)}>
      {tld}
    </span>
  )
}

function DomainRow({ result }: { result: DomainResult }) {
  const dot = result.domain.lastIndexOf('.')
  const name = result.domain.slice(0, dot)
  const tld = result.domain.slice(dot)

  return (
    <div className={cn(
      'flex items-center justify-between gap-4 rounded-xl border px-5 py-4 transition',
      result.available
        ? 'border-border bg-card hover:border-primary/30 hover:bg-accent/30'
        : 'border-border/50 bg-muted/30 opacity-60',
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <TldBadge tld={tld} />
        <span className="font-mono text-sm font-medium truncate">
          {name}<span className="text-muted-foreground">{tld}</span>
        </span>
        {result.premium && (
          <span className="hidden sm:inline-flex items-center rounded-full border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            PREMIUM
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {result.available ? (
          <>
            <span className="text-sm font-semibold tabular-nums">
              {result.priceUsd != null ? `$${result.priceUsd.toFixed(2)}/yr` : '—'}
            </span>
            <a
              href={result.buyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="gap-1.5">
                Buy at Dynadot
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Get a custom domain</h1>
        <p className="text-sm text-muted-foreground">
          Search for a domain, buy it at Dynadot, then come back and connect it to your site.
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
          placeholder="mybusiness.com or just &quot;mybusiness&quot;"
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

          {/* Post-purchase callout */}
          {available.length > 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Already bought your domain?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connect it to your site from the dashboard — takes about 5 minutes.
                </p>
              </div>
              <Link href="/dashboard/domains/connect">
                <Button variant="outline" size="sm" className="shrink-0">
                  Connect a domain →
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!results && !loading && !error && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">Search for your domain above</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Type a name or a full domain like <span className="font-mono">mybusiness.com</span>. We'll check .com, .net, .org, .io, .co, and .dev.
          </p>
        </div>
      )}
    </div>
  )
}
