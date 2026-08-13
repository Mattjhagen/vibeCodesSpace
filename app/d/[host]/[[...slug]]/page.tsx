/**
 * A published tenant site on the customer's own domain.
 *
 * Reached only by rewrite from `proxy.ts` when the Host header is neither the
 * app nor a `*.vibecodes.space` subdomain. Identical content to
 * `/s/[subdomain]`, differing only in how the site is found and what the
 * canonical URL says — the customer's domain is the canonical one once it is
 * connected, otherwise search engines index the subdomain and the domain they
 * paid for never ranks.
 *
 * Two independent gates have to pass for anything to render, and neither is
 * checked in this file:
 *
 *   1. `custom_domains` RLS exposes the row only when `connected` — both the
 *      ownership TXT record and the pointing record verified.
 *   2. `sites` RLS exposes the row only when published and not suspended.
 *
 * So an unverified claim, or a verified domain on a suspended site, 404s
 * without a conditional here that someone could later "simplify" away.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { PageView } from '@/components/site-engine/render'
import { derivedDescription, findPage } from '@/lib/content-model'
import { loadSiteContent } from '@/lib/migrate-content'

// Tenant pages render arbitrary, runtime-created sites straight from the
// database and must reflect publish/unpublish immediately. Without this,
// Next statically caches the route and will keep serving a stale 404 that
// was rendered while the page was briefly broken.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ host: string; slug?: string[] }> }

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

async function load(host: string, slug?: string[]) {
  const supabase = anonClient()

  const { data: domain } = await supabase
    .from('custom_domains')
    .select('site_id')
    .eq('host', host.toLowerCase())
    .maybeSingle()

  if (!domain) return null

  const { data: site } = await supabase
    .from('sites')
    .select('id, name, theme, content, subdomain, updated_at')
    .eq('id', domain.site_id)
    .maybeSingle()

  if (!site) return null

  const content = loadSiteContent(site.content, { name: site.name, theme: site.theme })
  const page = findPage(content, (slug ?? []).join('/'))
  return page ? { site, content, page } : null
}

/**
 * Count the view. Fire-and-forget on purpose: a failure to record analytics
 * must never fail the page a visitor asked for, and the SECURITY DEFINER
 * function ignores unpublished sites itself.
 */
async function recordView(siteId: string, path: string) {
  try {
    await anonClient().rpc('record_page_view', { p_site_id: siteId, p_path: path })
  } catch {
    /* analytics are not worth an error page */
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { host, slug } = await params
  const loaded = await load(host, slug)
  if (!loaded) return { title: 'Not found', robots: { index: false, follow: false } }

  const description = derivedDescription(loaded.page)
  const path = loaded.page.slug ? `/${loaded.page.slug}` : ''
  return {
    title: `${loaded.page.title} — ${loaded.site.name}`,
    description,
    openGraph: { title: loaded.page.title, description, type: 'website' },
    // Canonical points at the custom domain, not the subdomain: the same
    // content is reachable at both, and the customer's domain is the one that
    // should accumulate the ranking.
    alternates: { canonical: `https://${host}${path}` },
  }
}

export default async function CustomDomainPage({ params }: Props) {
  const { host, slug } = await params
  const loaded = await load(host, slug)
  if (!loaded) notFound()

  await recordView(loaded.site.id, '/' + (slug ?? []).join('/'))

  return <PageView site={loaded.content} page={loaded.page} />
}
