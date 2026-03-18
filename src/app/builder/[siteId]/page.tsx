import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { BuilderEditor } from './builder-editor'
import { RenderSection } from '@/components/site-engine/sections'
import { SiteContent } from '@/lib/site-generation'
import { Button } from '@/components/ui/button'

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

  const content = (site.content as any as SiteContent) || { sections: [] };

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
          <div className="p-4 border-b font-medium text-sm bg-muted/20">Site Sections</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {content.sections.map((section, idx) => (
               <div key={section.id} className="p-3 border rounded-lg bg-card hover:border-primary/50 transition-colors cursor-pointer group shadow-sm">
                 <div className="flex items-center justify-between">
                   <div className="flex flex-col">
                     <span className="text-xs text-muted-foreground uppercase font-semibold">Section {idx + 1}</span>
                     <span className="text-sm font-medium capitalize">{section.type}</span>
                   </div>
                   <div className="w-6 h-6 rounded flex items-center justify-center bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                     &rarr;
                   </div>
                 </div>
               </div>
             ))}
             <Button variant="outline" className="w-full border-dashed" size="sm">
               + Add Section
             </Button>
          </div>
        </aside>
        
        {/* Visual Canvas border/container simulating a browser window for editing */}
        <div className="flex-1 relative bg-muted/30 p-4 md:p-8 flex flex-col overflow-hidden">
          <div className="w-full h-full max-w-5xl mx-auto bg-background border border-border/50 rounded-xl shadow-lg flex flex-col overflow-hidden">
            {/* Mock browser header */}
            <div className="h-10 bg-muted/40 border-b flex items-center px-4 gap-2 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="mx-auto bg-background/80 border text-[10px] md:text-xs px-4 md:px-24 py-1 rounded text-muted-foreground shadow-sm truncate max-w-[300px]">
                {site.custom_domain || `${site.subdomain || 'preview'}.vibecodes.space`}
              </div>
            </div>
            {/* Visual Canvas Area */}
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="w-full min-h-full">
                {content.sections.length > 0 ? (
                  content.sections.map(section => (
                    <RenderSection key={section.id} section={section} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-20 text-muted-foreground">
                    <p className="font-medium">No content generated yet.</p>
                    <p className="text-sm">Start by adding a section from the sidebar.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
