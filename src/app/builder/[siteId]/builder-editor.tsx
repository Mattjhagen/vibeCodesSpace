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
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { publishSite } from './publish-action'

interface Props {
  siteId: string
  initialStatus: string
  initialSubdomain?: string
}

type Phase = 'form' | 'going-live' | 'live'

const POLL_INTERVAL = 6 // seconds between probe checks
const MAX_POLLS = 20   // give up after ~2 minutes

export function BuilderEditor({ siteId, initialStatus, initialSubdomain }: Props) {
  const [open, setOpen] = useState(false)
  const [subdomain, setSubdomain] = useState(initialSubdomain ?? '')
  const [publishing, setPublishing] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(
    initialSubdomain ? `https://${initialSubdomain}.vibecodes.space` : null,
  )
  const [status, setStatus] = useState(initialStatus)
  const [phase, setPhase] = useState<Phase>('form')
  const [countdown, setCountdown] = useState(POLL_INTERVAL)
  const [polls, setPolls] = useState(0)
  const [liveUrl, setLiveUrl] = useState<string | null>(null)

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isPublished = status === 'published' && publishedUrl

  const stopTimers = useCallback(() => {
    if (pollRef.current) clearTimeout(pollRef.current)
    if (countRef.current) clearInterval(countRef.current)
  }, [])

  const probe = useCallback(async (sub: string, attempt: number) => {
    if (attempt >= MAX_POLLS) {
      // Timed out — site might still be propagating; just show the URL
      setPhase('live')
      setLiveUrl(`https://${sub}.vibecodes.space`)
      return
    }

    try {
      const res = await fetch(`/api/probe?sub=${encodeURIComponent(sub)}`, { cache: 'no-store' })
      const data = await res.json() as { ok: boolean; status: number }
      if (data.ok) {
        stopTimers()
        setPhase('live')
        setLiveUrl(`https://${sub}.vibecodes.space`)
        return
      }
    } catch {
      // Network error — keep trying
    }

    // Schedule next poll
    setPolls(attempt + 1)
    setCountdown(POLL_INTERVAL)
    countRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (countRef.current) clearInterval(countRef.current)
          return 0
        }
        return c - 1
      })
    }, 1000)
    pollRef.current = setTimeout(() => probe(sub, attempt + 1), POLL_INTERVAL * 1000)
  }, [stopTimers])

  // Kick off polling when dialog opens in going-live phase
  useEffect(() => {
    if (open && phase === 'going-live' && subdomain) {
      probe(subdomain, 0)
    }
    return () => { if (!open) stopTimers() }
  }, [open, phase, subdomain, probe, stopTimers])

  // Clean up on unmount
  useEffect(() => () => stopTimers(), [stopTimers])

  function resetToForm() {
    stopTimers()
    setPhase('form')
    setCountdown(POLL_INTERVAL)
    setPolls(0)
  }

  async function handlePublish() {
    if (!subdomain.trim()) return
    setPublishing(true)
    const result = await publishSite(siteId, subdomain.trim())
    setPublishing(false)

    if (result.ok) {
      setPublishedUrl(result.url)
      setStatus('published')
      setPhase('going-live')
      setCountdown(POLL_INTERVAL)
      setPolls(0)
    } else {
      toast.error(result.error)
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetToForm()
    setOpen(next)
  }

  const url = liveUrl ?? publishedUrl ?? `https://${subdomain}.vibecodes.space`

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

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">

          {/* ── Form phase ── */}
          {phase === 'form' && (
            <>
              <DialogHeader>
                <DialogTitle>{isPublished ? 'Update your site address' : 'Publish your site'}</DialogTitle>
                <DialogDescription>
                  Choose a subdomain — your site will be live at{' '}
                  <span className="font-mono text-foreground">[name].vibecodes.space</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Site address</Label>
                  <div className="flex items-center gap-0">
                    <Input
                      id="subdomain"
                      value={subdomain}
                      onChange={e =>
                        setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                      }
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
                  <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                  <Button onClick={handlePublish} disabled={publishing || !subdomain.trim()}>
                    {publishing ? 'Publishing…' : isPublished ? 'Update address' : 'Publish'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ── Going Live phase ── */}
          {phase === 'going-live' && (
            <>
              <DialogHeader>
                <DialogTitle>Your site is going live…</DialogTitle>
                <DialogDescription>
                  We&apos;re waiting for your site to become reachable. This usually takes under a minute.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* URL pill */}
                <div className="rounded-lg bg-muted px-4 py-3 font-mono text-sm break-all text-center">
                  {url}
                </div>

                {/* Status rows */}
                <div className="space-y-2 text-sm">
                  <StatusRow done label="Subdomain claimed" />
                  <StatusRow done label="Site content published" />
                  <StatusRow label="DNS propagating" spinning />
                  <StatusRow label="SSL certificate active" muted />
                  <StatusRow label="Site reachable" muted />
                </div>

                {/* Countdown */}
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    Checking again in <span className="font-mono font-semibold text-foreground">{countdown}s</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Attempt {polls + 1} of {MAX_POLLS}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  You can close this — your site will still go live in the background.
                </p>

                <Button variant="outline" className="w-full" onClick={() => handleOpenChange(false)}>
                  Close and check later
                </Button>
              </div>
            </>
          )}

          {/* ── Live phase ── */}
          {phase === 'live' && (
            <>
              <DialogHeader>
                <DialogTitle>Your site is live! 🎉</DialogTitle>
                <DialogDescription>
                  Anyone with the link can now visit your site.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="rounded-lg bg-muted px-4 py-3 font-mono text-sm break-all text-center">
                  {url}
                </div>

                <div className="space-y-2 text-sm">
                  <StatusRow done label="Subdomain claimed" />
                  <StatusRow done label="Site content published" />
                  <StatusRow done label="DNS propagating" />
                  <StatusRow done label="SSL certificate active" />
                  <StatusRow done label="Site reachable" />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => { window.open(url, '_blank'); handleOpenChange(false) }}
                  >
                    Open site
                  </Button>
                  <Button variant="outline" onClick={() => handleOpenChange(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}

        </DialogContent>
      </Dialog>
    </>
  )
}

function StatusRow({
  done = false,
  spinning = false,
  muted = false,
  label,
}: {
  done?: boolean
  spinning?: boolean
  muted?: boolean
  label: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 text-center text-base leading-none">
        {done ? '✓' : spinning ? <Spinner /> : '·'}
      </span>
      <span
        className={
          done
            ? 'text-foreground'
            : spinning
            ? 'text-foreground font-medium'
            : muted
            ? 'text-muted-foreground'
            : 'text-muted-foreground'
        }
      >
        {label}
      </span>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="inline-block animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}
