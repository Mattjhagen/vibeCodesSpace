import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { BuilderShell } from './builder-shell'
import { SiteContent } from '@/lib/site-generation'

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

  const initialContent = (site.content as any as SiteContent) || { sections: [] };

  return <BuilderShell site={site} initialContent={initialContent} />
}
