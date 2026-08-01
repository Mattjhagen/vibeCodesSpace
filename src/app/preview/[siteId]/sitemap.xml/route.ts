/**
 * Per-site sitemap, generated from the content model rather than maintained
 * by hand — every page in the model is a URL, so the two cannot drift.
 *
 * The base URL is the site's own domain when it has one, because a sitemap
 * listing URLs on a different origin is ignored by crawlers.
 */

import { createClient } from '@/utils/supabase/server'
import { sitemapPaths } from '@/lib/content-model'
import { loadSiteContent } from '@/lib/migrate-content'

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await ctx.params
  const supabase = await createClient()

  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .maybeSingle()

  if (!site) {
    return new Response('Not found', { status: 404 })
  }

  const content = loadSiteContent(site.content, { name: site.name, theme: site.theme })

  const origin = site.custom_domain
    ? `https://${site.custom_domain}`
    : site.subdomain
      ? `https://${site.subdomain}.vibecodes.space`
      : ''

  const lastmod = site.updated_at ? new Date(site.updated_at).toISOString() : undefined

  const urls = sitemapPaths(content)
    .map((path) => {
      const loc = xmlEscape(`${origin}${path}`)
      return `  <url>\n    <loc>${loc}</loc>${
        lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
      }\n  </url>`
    })
    .join('\n')

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
