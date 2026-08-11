import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { BuilderShell } from './builder-shell'
import { loadSiteContent } from '@/lib/migrate-content'
import { planForWorkspace } from '@/lib/generation-limits'

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

  // Fetch the workspace to determine plan
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const plan = workspace ? await planForWorkspace(supabase, workspace.id) : 'free'

  const initialContent = loadSiteContent(site.content, {
    name: site.name,
    theme: site.theme,
  })

  return <BuilderShell site={site} initialContent={initialContent} plan={plan} />
}
