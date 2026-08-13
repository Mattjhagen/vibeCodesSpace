a/**
 * A published tenant site.
 *
 * Reached only by rewrite from `proxy.ts` when the Host header is
 * `<subdomain>.vibecodes.space`, so the page runs on the tenant's own origin.
 *
 * Reads through a bare anon client rather than the cookie-aware server client.
 * A tenant page has no business touching the app's session: cookies would not
 * be sent cross-origin anyway, but constructing a client that *looks* for them
 * on this path invites someone to later "fix" it into working.
 *
 * The RLS policy added in the publishing migration is what makes this readable
 * at all, and it is also the enforcement point for suspension — a suspended
 * site stops matching the policy, so it 404s without any check here.
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

type Props = { params: Promise<{ subdomain: string; slug?: string[] }> }

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

async function load(subdomain: string, slug?: string[]) {
  const supabase = anonClient()

  const { data: site } = await supabase
    .from('sites')
    .select('id, name, theme, content, subdomain, updated_at, tab_title, favicon_url')
    .eq('subdomain', subdomain)
    // status='published' AND suspended_at IS NULL is enforced by RLS, not here,
    // so a suspended site is invisible even if this query changes.
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
  const { subdomain, slug } = await params
  const loaded = await load(subdomain, slug)
  if (!loaded) return { title: 'Not found', robots: { index: false, follow: false } }

  const description = derivedDescription(loaded.page)
  const title = loaded.site.tab_title
    ? loaded.site.tab_title
    : `${loaded.page.title} — ${loaded.site.name}`
  return {
    title,
    description,
    openGraph: { title: loaded.page.title, description, type: 'website' },
    alternates: { canonical: `https://${subdomain}.vibecodes.space${loaded.page.slug ? `/${loaded.page.slug}` : ''}` },
    ...(loaded.site.favicon_url ? {
      icons: {
        icon: loaded.site.favicon_url,
        shortcut: loaded.site.favicon_url,
        apple: loaded.site.favicon_url,
      }
    } : {}),
  }
}

export default async function TenantPage({ params }: Props) {
  const { subdomain, slug } = await params
  const loaded = await load(subdomain, slug)
  if (!loaded) notFound()

  await recordView(loaded.site.id, '/' + (slug ?? []).join('/'))

  return <PageView site={loaded.content} page={loaded.page} />
}
