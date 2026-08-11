import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { planForWorkspace } from '@/lib/generation-limits'
import Link from 'next/link'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!workspace) redirect('/dashboard')

  const plan = await planForWorkspace(supabase, workspace.id)

  // Get all sites for this workspace
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, subdomain, status')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  const siteIds = (sites ?? []).map((s) => s.id)

  // Get page views — last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const since = thirtyDaysAgo.toISOString().split('T')[0]

  const { data: viewRows } = siteIds.length
    ? await supabase
        .from('site_page_views')
        .select('site_id, day, path, views')
        .in('site_id', siteIds)
        .gte('day', since)
        .order('day', { ascending: false })
    : { data: [] }

  // Aggregate per site
  const siteViewMap: Record<string, number> = {}
  for (const row of viewRows ?? []) {
    siteViewMap[row.site_id] = (siteViewMap[row.site_id] ?? 0) + row.views
  }

  const totalViews = Object.values(siteViewMap).reduce((a, b) => a + b, 0)

  // Top pages across all sites (last 30 days)
  const pageMap: Record<string, number> = {}
  for (const row of viewRows ?? []) {
    const site = (sites ?? []).find((s) => s.id === row.site_id)
    const key = site ? `${site.subdomain ?? site.name}${row.path}` : row.path
    pageMap[key] = (pageMap[key] ?? 0) + row.views
  }
  const topPages = Object.entries(pageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Daily totals for sparkline (last 14 days)
  const dailyMap: Record<string, number> = {}
  for (const row of viewRows ?? []) {
    dailyMap[row.day] = (dailyMap[row.day] ?? 0) + row.views
  }
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const key = d.toISOString().split('T')[0]
    return { date: key, views: dailyMap[key] ?? 0 }
  })

  const maxDay = Math.max(...last14.map((d) => d.views), 1)

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Last 30 days across all your sites</p>
        </div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition">
          ← Dashboard
        </Link>
      </div>

      {plan === 'free' && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <strong className="text-foreground">Analytics are available on all plans.</strong>
          {' '}
          <Link href="/pricing" className="text-primary underline underline-offset-2">
            Upgrade to Pro
          </Link>
          {' '}for unlimited sites and no PurePulse branding.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground mb-1">Total Views</div>
          <div className="text-3xl font-bold">{fmt(totalViews)}</div>
          <div className="text-xs text-muted-foreground mt-1">last 30 days</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground mb-1">Published Sites</div>
          <div className="text-3xl font-bold">
            {(sites ?? []).filter((s) => s.status === 'published').length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">of {(sites ?? []).length} total</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground mb-1">Plan</div>
          <div className="text-3xl font-bold capitalize">{plan}</div>
          {plan === 'free' && (
            <Link href="/pricing" className="text-xs text-primary underline underline-offset-2 mt-1 block">
              Upgrade →
            </Link>
          )}
        </div>
      </div>

      {/* Sparkline bar chart */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="text-sm font-medium">Daily Views — Last 14 Days</div>
        <div className="flex items-end gap-1 h-24">
          {last14.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full flex flex-col justify-end" style={{ height: '80px' }}>
                <div
                  className="w-full rounded-sm bg-primary/70 group-hover:bg-primary transition-all"
                  style={{ height: `${Math.round((d.views / maxDay) * 80)}px`, minHeight: d.views > 0 ? '2px' : '0' }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground hidden sm:block">
                {d.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-site breakdown */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="text-sm font-medium">Views by Site</div>
        {(sites ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No sites yet. <Link href="/dashboard" className="underline underline-offset-2">Create one →</Link></p>
        ) : (
          <div className="space-y-2">
            {(sites ?? []).map((site) => {
              const views = siteViewMap[site.id] ?? 0
              const pct = totalViews > 0 ? Math.round((views / totalViews) * 100) : 0
              return (
                <div key={site.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{site.name}</span>
                      {site.subdomain && (
                        <a
                          href={`https://${site.subdomain}.vibecodes.space`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground transition"
                        >
                          ↗
                        </a>
                      )}
                      {site.status !== 'published' && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          {site.status}
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground">{fmt(views)} views</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Top pages */}
      {topPages.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="text-sm font-medium">Top Pages</div>
          <div className="space-y-1">
            {topPages.map(([page, views], i) => (
              <div key={page} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-5 text-right">{i + 1}</span>
                  <span className="font-mono text-xs text-muted-foreground truncate max-w-xs">{page}</span>
                </div>
                <span>{fmt(views)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
