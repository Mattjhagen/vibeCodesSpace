'use client'

/**
 * Field-level editing for v2 blocks.
 *
 * Deliberately plain inputs driven off the block schema. The real editor —
 * add/remove/reorder, inline editing, image upload, undo/redo — is the next
 * step; this exists so the builder keeps working against the new model rather
 * than regressing to "editing coming soon" while the model lands.
 *
 * Every change goes through `parseBlock`, so the editor cannot write a shape
 * the renderer would choke on, and a pasted `javascript:` URL is sanitized on
 * the way in rather than only at render time.
 */

import { useState } from 'react'
import { Block, parseBlock } from '@/lib/content-model'
import { uploadSiteImage } from '@/app/builder/[siteId]/upload-action'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {multiline ? (
        <Textarea
          value={value}
          rows={4}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        />
      ) : (
        <Input
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

/** Upload straight to Supabase storage and write the returned URL into the block. */
function ImageUpload({
  siteId,
  onUploaded,
}: {
  siteId: string
  onUploaded: (url: string) => void
}) {
  const [busy, setBusy] = useState(false)

  return (
    <div className="grid gap-2">
      <Label>Upload an image</Label>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        disabled={busy}
        className="text-xs file:mr-3 file:rounded-md file:border file:bg-secondary file:px-3 file:py-1.5 file:text-xs"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setBusy(true)
          const body = new FormData()
          body.append('file', file)
          const result = await uploadSiteImage(siteId, body)
          setBusy(false)
          // Let the same file be picked again after a failure.
          e.target.value = ''
          if (result.ok) {
            onUploaded(result.url)
            toast.success('Image uploaded')
          } else {
            toast.error(result.error)
          }
        }}
      />
      {busy && <p className="text-xs text-muted-foreground">Uploading…</p>}
    </div>
  )
}

export function BlockEditor({
  block,
  siteId,
  onChange,
}: {
  block: Block
  siteId: string
  onChange: (next: Block) => void
}) {
  /** Re-validate on every edit so stored content is always model-conformant. */
  const patch = (fields: Record<string, unknown>) => {
    const next = parseBlock({ ...block, ...fields })
    if (next) onChange(next)
  }

  switch (block.type) {
    case 'heading':
      return (
        <div className="space-y-4">
          <Field label="Heading" value={block.text} onChange={(v) => patch({ text: v })} />
          <div className="grid gap-2">
            <Label>Level</Label>
            <select
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
              value={block.level}
              onChange={(e) => patch({ level: Number(e.target.value) })}
            >
              <option value={1}>Page title (H1)</option>
              <option value={2}>Section (H2)</option>
              <option value={3}>Sub-section (H3)</option>
            </select>
          </div>
        </div>
      )

    case 'text':
      return (
        <Field label="Text" value={block.text} onChange={(v) => patch({ text: v })} multiline />
      )

    case 'image':
      return (
        <div className="space-y-4">
          <ImageUpload siteId={siteId} onUploaded={(url) => patch({ src: url })} />
          <Field label="…or paste an image URL" value={block.src} onChange={(v) => patch({ src: v })} />
          <Field
            label="Alt text (describe the image)"
            value={block.alt}
            onChange={(v) => patch({ alt: v })}
          />
        </div>
      )

    case 'button':
      return (
        <div className="space-y-4">
          <Field label="Label" value={block.label} onChange={(v) => patch({ label: v })} />
          <Field label="Link" value={block.href} onChange={(v) => patch({ href: v })} />
        </div>
      )

    case 'list':
      return (
        <Field
          label="Items (one per line)"
          value={block.items.join('\n')}
          onChange={(v) => patch({ items: v.split('\n') })}
          multiline
        />
      )

    case 'quote':
      return (
        <div className="space-y-4">
          <Field label="Quote" value={block.text} onChange={(v) => patch({ text: v })} multiline />
          <Field
            label="Attribution"
            value={block.attribution}
            onChange={(v) => patch({ attribution: v })}
          />
        </div>
      )

    case 'contact':
      return (
        <div className="space-y-4">
          <Field label="Note" value={block.note} onChange={(v) => patch({ note: v })} multiline />
          <Field label="Email" value={block.email} onChange={(v) => patch({ email: v })} />
          <Field label="Phone" value={block.phone} onChange={(v) => patch({ phone: v })} />
        </div>
      )

    case 'cards':
      return (
        <div className="space-y-4">
          {block.items.map((card, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-3">
              <Field
                label={`Card ${i + 1} title`}
                value={card.title}
                onChange={(v) => {
                  const items = block.items.map((c, j) => (j === i ? { ...c, title: v } : c))
                  patch({ items })
                }}
              />
              <Field
                label="Body"
                value={card.body}
                onChange={(v) => {
                  const items = block.items.map((c, j) => (j === i ? { ...c, body: v } : c))
                  patch({ items })
                }}
                multiline
              />
            </div>
          ))}
        </div>
      )

    case 'stats':
      return (
        <div className="space-y-4">
          {block.items.map((stat, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-3">
              <Field
                label={`Stat ${i + 1} value`}
                value={stat.value}
                onChange={(v) => {
                  const items = block.items.map((s, j) => (j === i ? { ...s, value: v } : s))
                  patch({ items })
                }}
              />
              <Field
                label="Label"
                value={stat.label}
                onChange={(v) => {
                  const items = block.items.map((s, j) => (j === i ? { ...s, label: v } : s))
                  patch({ items })
                }}
              />
            </div>
          ))}
        </div>
      )

    case 'divider':
      return <p className="text-xs text-muted-foreground">A divider has nothing to edit.</p>
  }
}
