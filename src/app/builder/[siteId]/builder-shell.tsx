'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RenderSection } from '@/components/site-engine/sections'
import { SectionEditor } from '@/components/site-engine/editor-forms'
import { SiteContent, SiteSection } from '@/lib/site-generation'
import { BuilderEditor } from './builder-editor'
import { updateSiteContent } from './actions'
import { toast } from 'sonner'

export function BuilderShell({ site, initialContent }: { site: any, initialContent: SiteContent }) {
  const [content, setContent] = useState<SiteContent>(initialContent)
  const [theme, setTheme] = useState(site.theme || 'Minimal Professional')
  const [activeTab, setActiveTab] = useState<'sections' | 'design'>('sections')
  const [activeSectionId, setActiveSectionId] = useState<string | null>(content.sections[0]?.id || null)
  const [isSaving, setIsSaving] = useState(false)

  const activeSection = content.sections.find(s => s.id === activeSectionId)

  const handleUpdateSection = (sectionId: string, newSectionContent: any) => {
    const newSections = content.sections.map(s => 
      s.id === sectionId ? { ...s, content: newSectionContent } : s
    )
    setContent({ sections: newSections })
  }

  const handleAddSection = () => {
    const newId = `section-${Date.now()}`
    const newSection: SiteSection = {
      id: newId,
      type: 'about',
      content: { title: 'New Section', text: 'Edit this text in the sidebar.' }
    }
    const newContent = { sections: [...content.sections, newSection] }
    setContent(newContent)
    setActiveSectionId(newId)
  }

  async function onSave() {
    setIsSaving(true)
    const result = await updateSiteContent(site.id, content, theme)
    if (result.success) {
      toast.success('Draft saved successfully')
    } else {
      toast.error('Failed to save: ' + result.error)
    }
    setIsSaving(false)
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
          <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving} className="w-24">
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <BuilderEditor siteId={site.id} initialStatus={site.status} />
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        {/* Left pane: Section List & Editor */}
        <aside className="w-80 border-r bg-muted/10 flex flex-col hidden md:flex shrink-0">
          <div className="flex border-b">
            <button 
              onClick={() => setActiveTab('sections')}
              className={cn(
                "flex-1 p-3 text-sm font-medium border-r transition-colors",
                activeTab === 'sections' ? "bg-background border-b-2 border-b-primary" : "bg-muted/30 hover:bg-muted/50"
              )}
            >
              Sections
            </button>
            <button 
              onClick={() => setActiveTab('design')}
              className={cn(
                "flex-1 p-3 text-sm font-medium transition-colors",
                activeTab === 'design' ? "bg-background border-b-2 border-b-primary" : "bg-muted/30 hover:bg-muted/50"
              )}
            >
              Design
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'sections' ? (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-sm">Site Sections</span>
                  {activeSectionId && (
                    <button 
                      onClick={() => setActiveSectionId(null)}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Back to List
                    </button>
                  )}
                </div>
                
                {!activeSectionId ? (
                  <div className="space-y-3">
                    {content.sections.map((section, idx) => (
                      <div 
                        key={section.id} 
                        onClick={() => setActiveSectionId(section.id)}
                        className="p-3 border rounded-lg bg-card hover:border-primary/50 transition-colors cursor-pointer group shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Section {idx + 1}</span>
                            <span className="text-sm font-medium capitalize">{section.type}</span>
                          </div>
                          <div className="text-muted-foreground group-hover:text-primary">&rarr;</div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full border-dashed" size="sm" onClick={handleAddSection}>
                      + Add Section
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold uppercase py-1 px-2 bg-primary/10 text-primary rounded">
                        Editing {activeSection?.type}
                      </span>
                    </div>
                    <SectionEditor 
                      section={activeSection!} 
                      onChange={(newVal) => handleUpdateSection(activeSectionId, newVal)} 
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-4">Select Template</h3>
                  <div className="grid gap-4">
                    {['Minimal Professional', 'Creative Portfolio', 'Startup Profile'].map(t => (
                      <div 
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          "p-4 border rounded-xl cursor-pointer transition-all duration-200",
                          theme === t ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:border-primary/50 bg-card"
                        )}
                      >
                        <div className="font-medium text-sm mb-1">{t}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {t === 'Startup Profile' ? 'Sleek dark mode with neon accents.' : t === 'Creative Portfolio' ? 'Vibrant gradients and bold typography.' : 'Clean, minimal and focused.'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
        
        {/* Visual Canvas Area */}
        <div className="flex-1 relative bg-muted/30 p-4 md:p-8 flex flex-col overflow-hidden">
          <div className="w-full h-full max-w-5xl mx-auto bg-background border border-border/50 rounded-xl shadow-lg flex flex-col overflow-hidden">
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
            <div className="flex-1 overflow-y-auto bg-white scroll-smooth transition-all">
              <div className="w-full min-h-full">
                {content.sections.length > 0 ? (
                  content.sections.map(section => (
                    <div 
                      key={section.id} 
                      className={cn(
                        "relative group",
                        activeSectionId === section.id && activeTab === 'sections' ? "ring-2 ring-primary ring-inset" : ""
                      )}
                      onClick={() => {
                        if (activeTab === 'sections') setActiveSectionId(section.id)
                      }}
                    >
                      <RenderSection section={section} theme={theme} />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="bg-primary text-white text-[10px] px-2 py-1 rounded shadow-lg uppercase font-bold">
                           {section.type}
                         </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-20 text-muted-foreground">
                    <p className="font-medium text-xl mb-2 text-foreground">Design your masterpiece</p>
                    <p className="text-sm mb-6">Start by adding your first professional section.</p>
                    <Button onClick={handleAddSection}>Add Hero Section</Button>
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
