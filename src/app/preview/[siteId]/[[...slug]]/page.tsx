/**
 * Multi-page preview of a site's content model.
 *
 * This is where "multi-page with navigation and routing" actually resolves:
 * one optional catch-all route maps `/preview/<id>` to the home page and
 * `/preview/<id>/<slug>` to any other page, with nav derived from the pages
 * themselves. Serving real published sites on their own subdomains is a
 * separate problem (origin isolation, wildcard certs) and belongs to the
 * publishing step; this proves the model routes.
 */

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PageView } from '@/components/site-engine/render'
import { derivedDescription, findPage } from '@/lib/content-model'
import { loadSiteContent } from '@/lib/migrate-content'

type Props = { params: Promise<{ siteId: string; slug?: string[] }> }

/** Shared loader so generateMetadata and the page agree on what they render. */
async function load(siteId: string, slug?: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS restricts `sites` to the owner's workspaces, so an unauthorised
  // siteId simply returns no row rather than needing a separate check.
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .maybeSingle()
  if (!site) return null

  const content = loadSiteContent(site.content, { name: site.name, theme: site.theme })
  const page = findPage(content, (slug ?? []).join('/'))
  return page ? { site, content, page } : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siteId, slug } = await params
  const loaded = await load(siteId, slug)
  if (!loaded) return { title: 'Not found' }

  const description = derivedDescription(loaded.page)
  return {
    title: `${loaded.page.title} — ${loaded.site.name}`,
    description,
    openGraph: {
      title: loaded.page.title,
      description,
      type: 'website',
    },
    // A preview is per-account working state, not something to index.
    robots: { index: false, follow: false },
  }
}

export default async function PreviewPage({ params }: Props) {
  const { siteId, slug } = await params
  const loaded = await load(siteId, slug)
  if (!loaded) notFound()

  return <PageView site={loaded.content} page={loaded.page} />
}
