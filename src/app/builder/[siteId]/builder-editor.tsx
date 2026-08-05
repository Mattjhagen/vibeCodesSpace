'use client'

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
import { useState } from 'react'
import { toast } from 'sonner'
import { publishSite } from './publish-action'

interface Props {
  siteId: string
  initialStatus: string
  initialSubdomain?: string
}

export function BuilderEditor({ siteId, initialStatus, initialSubdomain }: Props) {
  const [open, setOpen] = useState(false)
  const [subdomain, setSubdomain] = useState(initialSubdomain ?? '')
  const [publishing, setPublishing] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(
    initialSubdomain ? `https://${initialSubdomain}.vibecodes.space` : null
  )
  const [status, setStatus] = useState(initialStatus)

  const isPublished = status === 'published' && publishedUrl

  async function handlePublish() {
    if (!subdomain.trim()) return
    setPublishing(true)
    const result = await publishSite(siteId, subdomain.trim())
    setPublishing(false)

    if (result.ok) {
      setPublishedUrl(result.url)
      setStatus('published')
      setOpen(false)
      toast.success('Site published!', {
        description: result.url,
        action: { label: 'Open', onClick: () => window.open(result.url, '_blank') },
        duration: 8000,
      })
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        variant={isPublished ? 'outline' : 'default'}
        className="w-28"
      >
        {isPublished ? 'Published ↗' : 'Publish'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isPublished ? 'Update your site address' : 'Publish your site'}</DialogTitle>
            <DialogDescription>
              Choose a subdomain for your site. It will be live at{' '}
              <span className="font-mono text-foreground">[your-name].vibecodes.space</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="subdomain">Site address</Label>
              <div className="flex items-center gap-0">
                <Input
                  id="subdomain"
                  value={subdomain}
                  onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="your-name"
                  className="rounded-r-none border-r-0 font-mono"
                  onKeyDown={e => e.key === 'Enter' && handlePublish()}
                  autoFocus
                />
                <span className="flex h-9 items-center rounded-r-md border border-input bg-muted px-3 text-sm text-muted-foreground font-mono whitespace-nowrap">
                  .vibecodes.space
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                3–63 characters, lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            {isPublished && publishedUrl && (
              <div className="rounded-md bg-muted px-3 py-2 text-sm">
                <span className="text-muted-foreground">Currently live at </span>
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline break-all"
                >
                  {publishedUrl}
                </a>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePublish} disabled={publishing || !subdomain.trim()}>
                {publishing ? 'Publishing…' : isPublished ? 'Update address' : 'Publish'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
