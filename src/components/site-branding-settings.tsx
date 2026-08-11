'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Settings } from 'lucide-react'
import { updateSiteBranding } from '@/app/builder/[siteId]/actions'
import { uploadSiteImage } from '@/app/builder/[siteId]/upload-action'

interface Props {
  siteId: string
  initialTabTitle?: string
  initialFaviconUrl?: string
}

export function SiteBrandingSettings({ siteId, initialTabTitle, initialFaviconUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [tabTitle, setTabTitle] = useState(initialTabTitle ?? '')
  const [faviconUrl, setFaviconUrl] = useState(initialFaviconUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFaviconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const result = await uploadSiteImage(siteId, body)
      if (!result.ok) throw new Error(result.error)
      setFaviconUrl(result.url)
      toast.success('Favicon uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const result = await updateSiteBranding(siteId, {
        tab_title: tabTitle || undefined,
        favicon_url: faviconUrl || undefined,
      })
      if (result.success) {
        toast.success('Branding saved')
        setOpen(false)
      } else {
        toast.error(result.error ?? 'Save failed')
      }
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title="Site settings"
      >
        <Settings className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Site Branding</DialogTitle>
            <DialogDescription>
              Customize how your site appears in the browser tab.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            {/* Tab title */}
            <div className="grid gap-2">
              <Label htmlFor="tab-title">Browser Tab Title</Label>
              <Input
                id="tab-title"
                placeholder="My Portfolio"
                value={tabTitle}
                onChange={(e) => setTabTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                What visitors see in their browser tab. Leave blank to use your site name.
              </p>
            </div>

            {/* Favicon */}
            <div className="grid gap-2">
              <Label>Favicon</Label>
              <div className="flex items-center gap-3">
                {faviconUrl ? (
                  <img
                    src={faviconUrl}
                    alt="Current favicon"
                    className="h-8 w-8 rounded object-contain border"
                  />
                ) : (
                  <div className="h-8 w-8 rounded border bg-muted flex items-center justify-center text-muted-foreground text-xs">
                    ?
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? 'Uploading...' : 'Upload image'}
                </Button>
                {faviconUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setFaviconUrl('')}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/x-icon,image/svg+xml"
                className="hidden"
                onChange={handleFaviconUpload}
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG, SVG or ICO. Square images work best (32×32 or 64×64).
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
