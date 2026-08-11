import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkSiteLimit } from '@/lib/generation-limits'
import { generateSiteWithAI } from '@/lib/openai'
import { loadSiteContent } from '@/lib/migrate-content'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url, theme = 'clean' } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  // Normalize URL
  let targetUrl = url.trim()
  if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`

  // 1. Fetch the site
  let html = ''
  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VibeCodes site importer)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return NextResponse.json({ error: `Could not fetch ${targetUrl} (${res.status})` }, { status: 400 })
    html = await res.text()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to fetch site: ${msg}` }, { status: 400 })
  }

  // 2. Extract readable text from HTML
  const text = extractText(html)
  if (text.length < 100) {
    return NextResponse.json({ error: 'Could not extract enough content from this site. It may require JavaScript to render.' }, { status: 400 })
  }

  // 3. Check workspace + site limit
  const { data: workspace } = await supabase.from('workspaces').select('id').eq('user_id', user.id).maybeSingle()
  if (!workspace) return NextResponse.json({ error: 'No workspace found' }, { status: 400 })

  const limit = await checkSiteLimit(supabase, workspace.id)
  if (!limit.allowed) return NextResponse.json({ error: 'plan_limit' }, { status: 403 })

  // 4. Generate site with AI from extracted content
  const prompt = `You are migrating the following website content to a new personal/business site. 
Extract the owner's name, tagline, about info, services/work, and contact info from this text.
Build a complete, well-structured site from it.

Website URL: ${targetUrl}
Extracted content:
${text.slice(0, 6000)}`

  let content
  try {
    const generated = await generateSiteWithAI('Migrated Site', prompt)
    content = loadSiteContent(generated, { name: 'Migrated Site', theme })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'AI generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // 5. Create the site
  const hostname = new URL(targetUrl).hostname.replace('www.', '')
  const { data: site, error } = await supabase
    .from('sites')
    .insert({
      workspace_id: workspace.id,
      name: `${hostname} (migrated)`,
      theme,
      status: 'draft',
      content,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ siteId: site.id })
}

/** Strip HTML tags and extract meaningful text */
function extractText(html: string): string {
  return html
    // Remove scripts, styles, nav, footer, head
    .replace(/<(script|style|noscript|head|nav|footer|header)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    // Remove all tags
    .replace(/<[^>]+>/g, ' ')
    // Decode entities
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
}
