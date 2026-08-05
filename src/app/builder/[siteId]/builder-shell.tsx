'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SectionView } from '@/components/site-engine/render'
import { BlockEditor } from '@/components/site-engine/editor-forms'
import {
  BLOCK_TYPES,
  Block,
  BlockType,
  Page,
  SECTION_VARIANTS,
  SectionVariant,
  SiteContent,
} from '@/lib/content-model'
import {
  History,
  addBlock,
  addPage,
  addSection,
  canRedo,
  canUndo,
  commit,
  initHistory,
  moveBlock,
  moveSection,
  redo,
  removeBlock,
  removePage,
  removeSection,
  setSectionVariant,
  undo,
  updateBlock,
} from '@/lib/editor-ops'
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
  const [history, setHistory] = useState<History<SiteContent>>(() =>
    initHistory(initialContent),
  )
  const content = history.present

  const [theme, setTheme] = useState(site.theme || 'Minimal Professional')
  const [activePageId, setActivePageId] = useState(content.pages[0]?.id ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const activePage: Page | undefined =
    content.pages.find((p) => p.id === activePageId) ?? content.pages[0]
  const pageId = activePage?.id ?? ''

  const selectedBlock: Block | undefined = useMemo(
    () => activePage?.sections.flatMap((s) => s.blocks).find((b) => b.id === selectedId),
    [activePage, selectedId],
  )
  const selectedSection = useMemo(
    () => activePage?.sections.find((s) => s.blocks.some((b) => b.id === selectedId)),
    [activePage, selectedId],
  )

  /** Every mutation goes through here, so every mutation is undoable. */
  const apply = useCallback(
    (fn: (site: SiteContent) => SiteContent) => {
      setHistory((h) => commit(h, fn(h.present)))
    },
    [],
  )

  const doUndo = useCallback(() => setHistory((h) => undo(h)), [])
  const doRedo = useCallback(() => setHistory((h) => redo(h)), [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod || e.key.toLowerCase() !== 'z') return
      // Let the browser handle undo inside a field being typed into.
      const el = document.activeElement as HTMLElement | null
      if (el && (el.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(el.tagName))) return
      e.preventDefault()
      if (e.shiftKey) doRedo()
      else doUndo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doUndo, doRedo])

  async function onSave() {
    setIsSaving(true)
    const result = await updateSiteContent(site.id, content, theme)
    if (result.success) toast.success('Draft saved')
    else toast.error('Failed to save: ' + result.error)
    setIsSaving(false)
  }

  const editHooks = {
    selectedId,
    onSelect: setSelectedId,
    onTextChange: (blockId: string, text: string) => {
      const block = activePage?.sections
        .flatMap((s) => s.blocks)
        .find((b) => b.id === blockId)
      if (!block) return
      if ((block.type === 'heading' || block.type === 'text') && block.text !== text) {
        apply((s) => updateBlock(s, { pageId, block: { ...block, text } }))
      }
    },
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-background">
      <header className="flex h-14 items-center border-b px-6 justify-between shrink-0 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <a href="/dashboard" className="text-sm font-medium hover:underline text-muted-foreground">
            &larr; Dashboard
          </a>
          <h1 className="text-sm font-bold truncate max-w-[160px]">{site.name}</h1>
          <span className="text-xs text-muted-foreground capitalize">{content.siteType}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={doUndo}
            disabled={!canUndo(history)}
            title="Undo (Ctrl/Cmd+Z)"
          >
            Undo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={doRedo}
            disabled={!canRedo(history)}
            title="Redo (Shift+Ctrl/Cmd+Z)"
          >
            Redo
          </Button>
          <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving} className="w-24">
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <BuilderEditor siteId={site.id} initialStatus={site.status} initialSubdomain={site.subdomain ?? undefined} />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r bg-muted/10 flex flex-col hidden md:flex shrink-0 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Pages */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Pages</span>
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    const title = window.prompt('Page name')
                    if (title) apply((s) => addPage(s, { title }))
                  }}
                >
                  + Add
                </button>
              </div>
              {content.pages.map((page) => (
                <div
                  key={page.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-2 text-sm',
                    page.id === pageId ? 'border-primary bg-primary/5' : 'bg-card',
                  )}
                >
                  <button
                    className="flex-1 text-left"
                    onClick={() => {
                      setActivePageId(page.id)
                      setSelectedId(null)
                    }}
                  >
                    <span className="font-medium">{page.title}</span>
                    <span className="block text-[11px] text-muted-foreground">/{page.slug}</span>
                  </button>
                  {content.pages.length > 1 && (
                    <button
                      className="text-xs text-muted-foreground hover:text-destructive px-1"
                      title="Delete page"
                      onClick={() => apply((s) => removePage(s, { pageId: page.id }))}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </section>

            {/* Sections on the active page */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Sections</span>
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => apply((s) => addSection(s, { pageId }))}
                >
                  + Add
                </button>
              </div>
              {activePage?.sections.map((section, i) => (
                <div key={section.id} className="rounded-lg border bg-card p-2 space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <select
                      className="text-xs bg-transparent border rounded px-1 py-0.5 flex-1"
                      value={section.variant}
                      onChange={(e) =>
                        apply((s) =>
                          setSectionVariant(s, {
                            pageId,
                            sectionId: section.id,
                            variant: e.target.value as SectionVariant,
                          }),
                        )
                      }
                    >
                      {SECTION_VARIANTS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    <button
                      className="px-1 text-xs disabled:opacity-30"
                      disabled={i === 0}
                      title="Move section up"
                      onClick={() => apply((s) => moveSection(s, { pageId, sectionId: section.id, delta: -1 }))}
                    >
                      ↑
                    </button>
                    <button
                      className="px-1 text-xs disabled:opacity-30"
                      disabled={i === (activePage?.sections.length ?? 0) - 1}
                      title="Move section down"
                      onClick={() => apply((s) => moveSection(s, { pageId, sectionId: section.id, delta: 1 }))}
                    >
                      ↓
                    </button>
                    <button
                      className="px-1 text-xs text-muted-foreground hover:text-destructive"
                      title="Delete section"
                      onClick={() => apply((s) => removeSection(s, { pageId, sectionId: section.id }))}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {section.blocks.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedId(b.id)}
                        className={cn(
                          'rounded border px-1.5 py-0.5 text-[10px] uppercase',
                          selectedId === b.id ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground',
                        )}
                      >
                        {b.type}
                      </button>
                    ))}
                  </div>

                  <select
                    className="w-full text-xs bg-transparent border rounded px-1 py-0.5"
                    value=""
                    onChange={(e) => {
                      const type = e.target.value as BlockType
                      if (type) apply((s) => addBlock(s, { pageId, sectionId: section.id, type }))
                      e.target.value = ''
                    }}
                  >
                    <option value="">+ Add block…</option>
                    {BLOCK_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              ))}
            </section>

            {/* Selected block */}
            {selectedBlock && (
              <section className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase py-1 px-2 bg-primary/10 text-primary rounded">
                    {selectedBlock.type}
                  </span>
                  <div className="flex gap-1">
                    <button
                      className="px-1 text-xs"
                      title="Move block up"
                      onClick={() => apply((s) => moveBlock(s, { pageId, blockId: selectedBlock.id, delta: -1 }))}
                    >
                      ↑
                    </button>
                    <button
                      className="px-1 text-xs"
                      title="Move block down"
                      onClick={() => apply((s) => moveBlock(s, { pageId, blockId: selectedBlock.id, delta: 1 }))}
                    >
                      ↓
                    </button>
                    <button
                      className="px-1 text-xs text-muted-foreground hover:text-destructive"
                      title="Delete block"
                      onClick={() => {
                        apply((s) => removeBlock(s, { pageId, blockId: selectedBlock.id }))
                        setSelectedId(null)
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  In section “{selectedSection?.variant}”. Headings and paragraphs can also be
                  edited directly in the preview.
                </p>
                <BlockEditor
                  block={selectedBlock}
                  siteId={site.id}
                  onChange={(next) => apply((s) => updateBlock(s, { pageId, block: next }))}
                />
              </section>
            )}

            {/* Theme */}
            <section className="space-y-2 border-t pt-4">
              <span className="font-medium text-sm">Theme</span>
              {['Minimal Professional', 'Creative Portfolio', 'Startup Profile'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    'w-full rounded-lg border p-2 text-left text-sm',
                    theme === t ? 'border-primary bg-primary/5' : 'bg-card',
                  )}
                >
                  {t}
                </button>
              ))}
            </section>
          </div>
        </aside>

        {/* Live preview */}
        <div className="flex-1 relative bg-muted/30 p-4 md:p-8 flex flex-col overflow-hidden">
          <div className="w-full h-full max-w-5xl mx-auto bg-background border border-border/50 rounded-xl shadow-lg flex flex-col overflow-hidden">
            <div className="h-10 bg-muted/40 border-b flex items-center px-4 gap-2 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="mx-auto bg-background/80 border text-[10px] md:text-xs px-4 md:px-24 py-1 rounded text-muted-foreground shadow-sm truncate max-w-[320px]">
                {site.custom_domain || `${site.subdomain || 'preview'}.vibecodes.space`}
                {activePage?.slug ? `/${activePage.slug}` : ''}
              </div>
            </div>
            <div
              className="flex-1 overflow-y-auto bg-white"
              onClick={() => setSelectedId(null)}
            >
              {activePage?.sections.length ? (
                activePage.sections.map((section) => (
                  <SectionView key={section.id} section={section} edit={editHooks} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-20 text-muted-foreground">
                  <p className="font-medium text-xl mb-2 text-foreground">This page is empty</p>
                  <p className="text-sm">Add a section from the sidebar to begin.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
