'use client'

import { useState } from 'react'
import { Block, parseBlock, sanitizeImageSrc } from '@/lib/content-model'
import { uploadSiteImage } from '@/app/builder/[siteId]/upload-action'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
      return <ButtonBlockEditor block={block} patch={patch} />

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

    case 'gallery':
      return <GalleryBlockEditor block={block} siteId={siteId} patch={patch} />
  }
}

// ----------------------------------------------------------------- button editor

type LinkType = 'web' | 'email' | 'phone' | 'sms'

const LINK_OPTIONS: { value: LinkType; label: string; placeholder: string; fieldLabel: string }[] = [
  { value: 'web',   label: 'Open a website',    placeholder: 'example.com',     fieldLabel: 'Website address' },
  { value: 'email', label: 'Send an email',      placeholder: 'you@example.com', fieldLabel: 'Email address' },
  { value: 'phone', label: 'Make a phone call',  placeholder: '+1 555 123 4567', fieldLabel: 'Phone number' },
  { value: 'sms',   label: 'Send a text message',placeholder: '+1 555 123 4567', fieldLabel: 'Phone number' },
]

function detectLinkType(href: string): LinkType {
  if (href.startsWith('mailto:')) return 'email'
  if (href.startsWith('tel:'))    return 'phone'
  if (href.startsWith('sms:'))    return 'sms'
  return 'web'
}

function stripPrefix(href: string, type: LinkType): string {
  if (href === '#' || !href) return ''
  if (type === 'email') return href.slice(7)
  if (type === 'phone') return href.slice(4)
  if (type === 'sms')   return href.slice(4)
  return href.replace(/^https?:\/\//, '')
}

function buildHref(type: LinkType, value: string): string {
  const v = value.trim()
  if (!v) return '#'
  switch (type) {
    case 'email': return `mailto:${v}`
    case 'phone': return `tel:${v.replace(/\s/g, '')}`
    case 'sms':   return `sms:${v.replace(/\s/g, '')}`
    case 'web':   return /^https?:\/\//.test(v) ? v : `https://${v}`
  }
}

function ButtonBlockEditor({
  block,
  patch,
}: {
  block: Extract<Block, { type: 'button' }>
  patch: (fields: Record<string, unknown>) => void
}) {
  const linkType = detectLinkType(block.href)
  const opt = LINK_OPTIONS.find((o) => o.value === linkType) ?? LINK_OPTIONS[0]

  return (
    <div className="space-y-4">
      <Field label="Button label" value={block.label} onChange={(v) => patch({ label: v })} />

      <div className="grid gap-2">
        <Label>What does this button do?</Label>
        <select
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
          value={linkType}
          onChange={(e) => {
            const t = e.target.value as LinkType
            // Preserve empty-but-typed prefix so detectLinkType picks up the new type immediately
            if (t === 'email') patch({ href: 'mailto:' })
            else if (t === 'phone') patch({ href: 'tel:' })
            else if (t === 'sms') patch({ href: 'sms:' })
            else patch({ href: '#' })
          }}
        >
          {LINK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label>{opt.fieldLabel}</Label>
        <Input
          value={stripPrefix(block.href, linkType)}
          placeholder={opt.placeholder}
          onChange={(e) => patch({ href: buildHref(linkType, e.target.value) })}
        />
      </div>
    </div>
  )
}

// ----------------------------------------------------------------- gallery editor

function GalleryBlockEditor({
  block,
  siteId,
  patch,
}: {
  block: Extract<Block, { type: 'gallery' }>
  siteId: string
  patch: (fields: Record<string, unknown>) => void
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const items = block.items

  const reorder = (from: number, to: number) => {
    if (from === to) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    patch({ items: next })
  }

  const removeItem = (idx: number) => {
    patch({ items: items.filter((_, i) => i !== idx) })
  }

  const updateItem = (idx: number, changes: Partial<(typeof items)[0]>) => {
    patch({ items: items.map((item, i) => (i === idx ? { ...item, ...changes } : item)) })
  }

  async function uploadFiles(files: File[]) {
    const uploaded: { src: string; alt: string; caption: string }[] = []
    for (const file of files) {
      const body = new FormData()
      body.append('file', file)
      const result = await uploadSiteImage(siteId, body)
      if (result.ok) {
        uploaded.push({ src: result.url, alt: '', caption: '' })
      } else {
        toast.error(result.error)
      }
    }
    if (uploaded.length) {
      patch({ items: [...block.items, ...uploaded] })
      toast.success(`${uploaded.length} photo${uploaded.length > 1 ? 's' : ''} added`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition',
          isDragOver ? 'border-primary bg-primary/5' : 'border-border',
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={async (e) => {
          e.preventDefault()
          setIsDragOver(false)
          const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
          if (files.length) await uploadFiles(files)
        }}
      >
        <div className="text-3xl">🖼️</div>
        <p className="text-sm font-medium">Drop photos here</p>
        <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition">
          Browse photos
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            multiple
            className="sr-only"
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'))
              if (files.length) await uploadFiles(files)
              e.target.value = ''
            }}
          />
        </label>
        <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP, GIF supported</p>
      </div>

      {/* Image grid with drag-and-drop reorder */}
      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            {items.length} photo{items.length > 1 ? 's' : ''} — drag to reorder
          </p>
          <div className="grid grid-cols-2 gap-2">
            {items.map((item, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragEnd={() => { setDragIdx(null); setDropTarget(null) }}
                onDragOver={(e) => { e.preventDefault(); setDropTarget(i) }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragIdx !== null) reorder(dragIdx, i)
                  setDragIdx(null)
                  setDropTarget(null)
                }}
                className={cn(
                  'relative rounded-lg overflow-hidden border-2 transition cursor-grab active:cursor-grabbing',
                  dropTarget === i && dragIdx !== i ? 'border-primary scale-[1.02]' : 'border-transparent',
                  dragIdx === i ? 'opacity-50' : '',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sanitizeImageSrc(item.src)}
                  alt={item.alt || 'Gallery photo'}
                  className="w-full h-24 object-cover bg-muted"
                />
                <button
                  className="absolute top-1 right-1 rounded-full bg-black/60 text-white w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-600 transition"
                  onClick={() => removeItem(i)}
                  title="Remove photo"
                  type="button"
                >
                  ✕
                </button>
                <div className="p-1.5 space-y-1">
                  <input
                    className="w-full text-[10px] border border-border rounded px-1.5 py-0.5 bg-transparent placeholder:text-muted-foreground/50"
                    placeholder="Description (for accessibility)"
                    value={item.alt}
                    onChange={(e) => updateItem(i, { alt: e.target.value })}
                  />
                  <input
                    className="w-full text-[10px] border border-border rounded px-1.5 py-0.5 bg-transparent placeholder:text-muted-foreground/50"
                    placeholder="Caption (optional)"
                    value={item.caption}
                    onChange={(e) => updateItem(i, { caption: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
