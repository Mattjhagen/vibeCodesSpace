'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SectionView } from '@/components/site-engine/render'
import { BlockEditor } from '@/components/site-engine/editor-forms'
import { Block, Page, SiteContent } from '@/lib/content-model'
import { BuilderEditor } from './builder-editor'
import { updateSiteContent } from './actions'
import { toast } from 'sonner'

type SiteRow = {
  id: string
  name: string
  status: string
  theme?: string
  subdomain?: string
  custom_domain?: string
}

export function BuilderShell({
  site,
  initialContent,
}: {
  site: SiteRow
  initialContent: SiteContent
}) {
  const [content, setContent] = useState<SiteContent>(initialContent)
  const [theme, setTheme] = useState(site.theme || 'Minimal Professional')
  const [activeTab, setActiveTab] = useState<'pages' | 'design'>('pages')
  const [activePageId, setActivePageId] = useState(content.pages[0]?.id ?? '')
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const activePage: Page | undefined =
    content.pages.find((p) => p.id === activePageId) ?? content.pages[0]

  const activeBlock: Block | undefined = activePage?.sections
    .flatMap((s) => s.blocks)
    .find((b) => b.id === activeBlockId)

  /** Replace one block, leaving the rest of the tree untouched. */
  function updateBlock(next: Block) {
    setContent((prev) => ({
      ...prev,
      pages: prev.pages.map((page) =>
        page.id !== activePage?.id
          ? page
          : {
              ...page,
              sections: page.sections.map((section) => ({
                ...section,
                blocks: section.blocks.map((b) => (b.id === next.id ? next : b)),
              })),
            },
      ),
    }))
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
          <a
            href="/dashboard"
            className="text-sm font-medium hover:underline text-muted-foreground mr-4"
          >
            &larr; Dashboard
          </a>
          <h1 className="text-sm font-bold truncate max-w-[200px]">{site.name}</h1>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              site.status === 'published'
                ? 'bg-green-100 text-green-700'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {site.status}
          </span>
          <span className="text-xs text-muted-foreground capitalize">{content.siteType}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="w-24"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <BuilderEditor siteId={site.id} initialStatus={site.status} />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r bg-muted/10 flex flex-col hidden md:flex shrink-0">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('pages')}
              className={cn(
                'flex-1 p-3 text-sm font-medium border-r transition-colors',
                activeTab === 'pages'
                  ? 'bg-background border-b-2 border-b-primary'
                  : 'bg-muted/30 hover:bg-muted/50',
              )}
            >
              Pages
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={cn(
                'flex-1 p-3 text-sm font-medium transition-colors',
                activeTab === 'design'
                  ? 'bg-background border-b-2 border-b-primary'
                  : 'bg-muted/30 hover:bg-muted/50',
              )}
            >
              Design
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'pages' ? (
              <div className="p-4 space-y-5">
                <div>
                  <span className="font-medium text-sm">Pages</span>
                  <div className="mt-3 space-y-2">
                    {content.pages.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => {
                          setActivePageId(page.id)
                          setActiveBlockId(null)
                        }}
                        className={cn(
                          'w-full rounded-lg border p-3 text-left text-sm transition-colors',
                          page.id === activePage?.id
                            ? 'border-primary bg-primary/5'
                            : 'bg-card hover:border-primary/50',
                        )}
                      >
                        <div className="font-medium">{page.title}</div>
                        <div className="text-[11px] text-muted-foreground">/{page.slug}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {activeBlock ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase py-1 px-2 bg-primary/10 text-primary rounded">
                        {activeBlock.type}
                      </span>
                      <button
                        onClick={() => setActiveBlockId(null)}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Done
                      </button>
                    </div>
                    <BlockEditor block={activeBlock} onChange={updateBlock} />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Select a block below to edit its text. Adding, removing and reordering
                    blocks arrives with the visual editor.
                  </p>
                )}

                {!activeBlock && activePage && (
                  <div className="space-y-2">
                    {activePage.sections.flatMap((s) =>
                      s.blocks.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setActiveBlockId(b.id)}
                          className="w-full rounded-md border bg-card p-2 text-left text-xs hover:border-primary/50"
                        >
                          <span className="uppercase text-[10px] text-muted-foreground">
                            {b.type}
                          </span>
                        </button>
                      )),
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-4">Select Template</h3>
                  <div className="grid gap-4">
                    {['Minimal Professional', 'Creative Portfolio', 'Startup Profile'].map((t) => (
                      <div
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          'p-4 border rounded-xl cursor-pointer transition-all duration-200',
                          theme === t
                            ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                            : 'hover:border-primary/50 bg-card',
                        )}
                      >
                        <div className="font-medium text-sm mb-1">{t}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {t === 'Startup Profile'
                            ? 'Sleek dark mode with neon accents.'
                            : t === 'Creative Portfolio'
                              ? 'Vibrant gradients and bold typography.'
                              : 'Clean, minimal and focused.'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

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
                {activePage?.slug ? `/${activePage.slug}` : ''}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-white scroll-smooth transition-all">
              {activePage && activePage.sections.length > 0 ? (
                activePage.sections.map((section) => (
                  <SectionView key={section.id} section={section} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-20 text-muted-foreground">
                  <p className="font-medium text-xl mb-2 text-foreground">
                    This page has no content yet
                  </p>
                  <p className="text-sm">Pick another page, or start a new site.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
