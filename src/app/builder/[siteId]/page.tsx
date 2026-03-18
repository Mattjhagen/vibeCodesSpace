import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { BuilderEditor } from './builder-editor'

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

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-background">
      <header className="flex h-14 items-center border-b px-6 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-sm font-medium hover:underline text-muted-foreground mr-4">
            &larr; Dashboard
          </a>
          <h1 className="text-sm font-bold truncate max-w-[200px]">{site.name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${site.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-secondary text-secondary-foreground'}`}>
            {site.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BuilderEditor siteId={site.id} initialStatus={site.status} />
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        {/* Left pane: Form based editor */}
        <aside className="w-80 border-r bg-muted/10 flex flex-col hidden md:flex">
          <div className="p-4 border-b font-medium text-sm bg-muted/20">Content Editor</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {/* Form controls for the site will go here */}
             <div className="rounded-lg border p-4 bg-card shadow-sm space-y-3">
               <div className="h-4 bg-muted animate-pulse rounded w-1/3"></div>
               <div className="h-8 bg-muted animate-pulse rounded w-full"></div>
               <div className="h-20 bg-muted animate-pulse rounded w-full"></div>
             </div>
             <div className="rounded-lg border p-4 bg-card shadow-sm space-y-3">
               <div className="h-4 bg-muted animate-pulse rounded w-1/4"></div>
               <div className="h-8 bg-muted animate-pulse rounded w-full"></div>
             </div>
          </div>
        </aside>
        
        {/* Visual Canvas border/container simulating a browser window for editing */}
        <div className="flex-1 relative bg-muted/30 p-4 md:p-8 flex items-center justify-center overflow-auto">
          <div className="w-full h-full max-w-5xl bg-background border border-border/50 rounded-xl shadow-lg flex flex-col overflow-hidden">
            {/* Mock browser header */}
            <div className="h-10 bg-muted/40 border-b flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="mx-auto bg-background/80 border text-xs px-24 py-1 rounded text-muted-foreground shadow-sm">
                preview.vibecodes.space
              </div>
            </div>
            {/* Visual Canvas Area */}
            <div className="flex-1 flex items-center justify-center overflow-auto min-h-0 bg-dot-pattern">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">Visual Canvas Placeholder</p>
                <p className="text-sm text-muted-foreground">Theme: {site.theme}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
