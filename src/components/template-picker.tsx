'use client'

import { useState } from 'react'
import { SITE_TEMPLATES } from '@/lib/site-templates'
import { SITE_THEMES } from '@/lib/site-themes'
import type { SiteContent } from '@/lib/content-model'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onApply: (content: SiteContent, themeId: string) => void
}

const CATEGORIES = ['All', 'Personal', 'Creative', 'Business', 'Services']

export function TemplatePicker({ open, onClose, onApply }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [category, setCategory] = useState('All')
  const [confirming, setConfirming] = useState(false)

  const filtered = SITE_TEMPLATES.filter(
    (t) => category === 'All' || t.category === category,
  )

  const selectedTemplate = SITE_TEMPLATES.find((t) => t.id === selected)

  function handleApply() {
    if (!selectedTemplate) return
    onApply(selectedTemplate.content, selectedTemplate.themeId)
    setSelected(null)
    setConfirming(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setSelected(null); setConfirming(false); onClose() } }}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-lg">Choose a Template</DialogTitle>
          <DialogDescription>
            Pick a starting design. Your current content will be replaced.
          </DialogDescription>
        </DialogHeader>

        {/* Category filter */}
        <div className="flex gap-2 px-6 py-3 border-b shrink-0 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'px-3 py-1 rounded-full text-sm whitespace-nowrap transition',
                category === c
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((template) => {
              const theme = SITE_THEMES.find((t) => t.id === template.themeId)
              const isSelected = selected === template.id
              return (
                <button
                  key={template.id}
                  onClick={() => setSelected(isSelected ? null : template.id)}
                  className={cn(
                    'text-left rounded-xl border-2 overflow-hidden transition hover:shadow-md',
                    isSelected ? 'border-primary shadow-md' : 'border-border',
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Theme palette overlay */}
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      {theme?.palette.map((color, i) => (
                        <span
                          key={i}
                          className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold">
                          Selected ✓
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{template.name}</span>
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {template.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Theme: {theme?.name}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {selected
              ? `"${selectedTemplate?.name}" selected — this will replace your current page content.`
              : 'Select a template above to get started.'}
          </p>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              disabled={!selected}
              onClick={() => {
                if (!confirming) { setConfirming(true); return }
                handleApply()
              }}
            >
              {confirming ? 'Yes, replace content' : 'Use Template'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
