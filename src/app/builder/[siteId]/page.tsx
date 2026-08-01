import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { BuilderShell } from './builder-shell'
import { loadSiteContent } from '@/lib/migrate-content'

export default async function BuilderPage(props: { params: Promise<{ siteId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: site } = await supabase.from('sites').select('*').eq('id', params.siteId).single()
  if (!site) {
    redirect('/dashboard')
  }

  // v1 rows migrate on read, v2 rows are re-validated. Neither the builder nor
  // anything downstream needs to know which version was stored.
  const initialContent = loadSiteContent(site.content, {
    name: site.name,
    theme: site.theme,
  })

  return <BuilderShell site={site} initialContent={initialContent} />
}
