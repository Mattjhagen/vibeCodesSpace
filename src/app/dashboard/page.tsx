import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { logout } from './actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    redirect('/login')
  }

  const user = userData.user;

  // Check onboarding status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('onboarding_completed, full_name')
    .eq('id', user.id)
    .single()
  
  if (profileError || !profile?.onboarding_completed) {
    redirect('/onboarding')
  }

  // Fetch workspaces and sites
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  let sites: { id: string, name: string, theme: string, status: string }[] = []
  if (workspace?.id) {
    const { data: sitesData, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
    
    if (!sitesError) {
      sites = sitesData || []
    }
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      <header className="flex h-16 items-center border-b px-6 justify-between bg-card text-card-foreground">
        <h1 className="text-lg font-bold">{workspace?.name || 'VibeCodes Workspace'}</h1>
        <form action={logout}>
          <Button variant="ghost" size="sm">Sign out</Button>
        </form>
      </header>
      <main className="flex-1 p-8 space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {profile.full_name || user.email}</p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/onboarding?create=true" className="rounded-xl border bg-card text-card-foreground shadow h-40 flex flex-col items-center justify-center p-6 border-dashed hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
            <span className="text-2xl mb-2">+</span>
            <span className="font-medium">Create New Site</span>
          </Link>
          {sites.map(site => (
            <div key={site.id} className="rounded-xl border bg-card text-card-foreground shadow h-40 flex flex-col p-6 hover:shadow-md transition-shadow cursor-pointer relative group">
              <h3 className="font-semibold text-lg truncate pr-8">{site.name}</h3>
              <p className="text-sm text-muted-foreground capitalize mt-1">Theme: {site.theme}</p>
              <div className="mt-auto flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${site.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {site.status}
                </span>
                <Link href={`/builder/${site.id}`}>
                  <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Edit</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
