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
import { useCallback, useEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { publishSite } from './publish-action'

interface Props {
  siteId: string
  initialStatus: string
  initialSubdomain?: string
  onSaveContent?: () => Promise<{ success: boolean; error?: string }>
}

type Phase = 'form' | 'confirm-update' | 'going-live' | 'live'
type ProbeStage = 'dns' | 'ssl' | 'live' | 'unknown'

const POLL_INTERVAL = 30
const SUBDOMAIN_INPUT_DELAY = 120

export function BuilderEditor({ siteId, initialStatus, initialSubdomain, onSaveContent }: Props) {
  const [open, setOpen] = useState(false)
  const [subdomain, setSubdomain] = useState(initialSubdomain ?? '')
  const [publishing, setPublishing] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(
    initialSubdomain ? `https://${initialSubdomain}.vibecodes.space` : null,
  )
  const [status, setStatus] = useState(initialStatus)
  const [phase, setPhase] = useState<Phase>('form')
  const [countdown, setCountdown] = useState(POLL_INTERVAL)
  const [attempts, setAttempts] = useState(0)
  const [probeStage, setProbeStage] = useState<ProbeStage>('dns')
  const [liveUrl, setLiveUrl] = useState<string | null>(null)
  const [showAddressChange, setShowAddressChange] = useState(false)

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const probeRef = useRef<(sub: string, attempt: number) => void>(() => {})

  const isPublished = status === 'published' && publishedUrl

  const stopTimers = useCallback(() => {
    if (pollRef.current) clearTimeout(pollRef.current)
    if (countRef.current) clearInterval(countRef.current)
    pollRef.current = null
    countRef.current = null
  }, [])

  const probe = useCallback(async (sub: string, attempt: number) => {
    setAttempts(attempt + 1)
    try {
      const res = await fetch(`/api/probe?sub=${encodeURIComponent(sub)}`, { cache: 'no-store' })
      const data = await res.json() as { ok: boolean; stage: ProbeStage; status: number }
      setProbeStage(data.stage)
      if (data.ok && data.stage === 'live') {
        stopTimers()
        setPhase('live')
        setLiveUrl(`https://${sub}.vibecodes.space`)
        return
      }
    } catch {
      // network error — keep trying
    }
    // A failed probe may complete after the dialog has been closed or a newer
    // probe has started. Keep exactly one countdown and retry pending.
    stopTimers()
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
    pollRef.current = setTimeout(
      () => probeRef.current(sub, attempt + 1),
      POLL_INTERVAL * 1000,
    )
  }, [stopTimers])

  useEffect(() => {
    probeRef.current = probe
  }, [probe])

  useEffect(() => {
    if (open && phase === 'going-live' && subdomain) {
      // Start on the next task so opening the dialog can paint before the
      // first probe updates its progress state.
      pollRef.current = setTimeout(() => probeRef.current(subdomain, 0), 0)
    }
    return stopTimers
  }, [open, phase, subdomain, stopTimers])

  useEffect(() => () => stopTimers(), [stopTimers])

  function startGoingLive() {
    setCountdown(POLL_INTERVAL)
    setAttempts(0)
    setProbeStage('dns')
    setPhase('going-live')
  }

  function resetToForm() {
    stopTimers()
    setPhase(isPublished ? 'confirm-update' : 'form')
    setCountdown(POLL_INTERVAL)
    setAttempts(0)
    setProbeStage('dns')
    setShowAddressChange(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetToForm()
    setOpen(next)
  }

  function handleButtonClick() {
    setOpen(true)
    setPhase(isPublished ? 'confirm-update' : 'form')
    setShowAddressChange(false)
  }

  // For already-published sites: save content then probe
  async function handlePublishChanges() {
    setPublishing(true)
    if (onSaveContent) {
      const result = await onSaveContent()
      if (!result.success) {
        toast.error('Failed to save: ' + (result.error ?? 'Unknown error'))
        setPublishing(false)
        return
      }
    }
    setPublishing(false)
    startGoingLive()
  }

  // First publish or address change
  async function handlePublish(requestedSubdomain = subdomain) {
    const normalizedSubdomain = requestedSubdomain.trim()
    if (!normalizedSubdomain) return
    setPublishing(true)
    if (onSaveContent) {
      await onSaveContent()
    }
    const result = await publishSite(siteId, normalizedSubdomain)
    setPublishing(false)
    if (result.ok) {
      setPublishedUrl(result.url)
      setStatus('published')
      setShowAddressChange(false)
      setSubdomain(normalizedSubdomain)
      startGoingLive()
    } else {
      toast.error(result.error)
    }
  }

  const url = liveUrl ?? publishedUrl ?? `https://${subdomain}.vibecodes.space`

  const dnsReady = probeStage === 'ssl' || probeStage === 'live'
  const sslReady = probeStage === 'live'
  const siteReady = phase === 'live'
  const dnsSpinning = !dnsReady && phase === 'going-live'
  const sslSpinning = dnsReady && !sslReady && phase === 'going-live'
  const siteSpinning = sslReady && !siteReady

  const minutes = Math.floor((attempts * POLL_INTERVAL) / 60)
  const elapsedLabel = minutes > 0 ? `${minutes}m elapsed` : `${attempts * POLL_INTERVAL}s elapsed`

  return (
    <>
      <Button
        size="sm"
        onClick={handleButtonClick}
        className="w-28"
      >
        Publish
      </Button>
      {isPublished && (
        <a
          href={publishedUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition"
          title="Visit live site"
        >
          ↗
        </a>
      )}

      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        // The builder can contain a large editable document. Preserve the
        // accessible focus trap without synchronously disabling every outside
        // element when this status dialog opens.
        modal="trap-focus"
      >
        <DialogContent className="sm:max-w-md">

          {/* ── Confirm update phase (already published) ── */}
          {phase === 'confirm-update' && (
            <>
              <DialogHeader>
                <DialogTitle>Publish your changes</DialogTitle>
                <DialogDescription>
                  Save and push your latest edits to your live site.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="rounded-lg bg-muted px-4 py-3 font-mono text-sm break-all text-center">
                  {publishedUrl}
                </div>
                <Button
                  className="w-full"
                  onClick={handlePublishChanges}
                  disabled={publishing}
                >
                  {publishing ? 'Saving…' : 'Publish changes'}
                </Button>
                <div className="border-t pt-3">
                  {!showAddressChange ? (
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition w-full text-center"
                      onClick={() => setShowAddressChange(true)}
                    >
                      Change site address →
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">Enter a new address for your site:</p>
                      <div className="flex items-center gap-0">
                        <SubdomainInput
                          initialValue={subdomain}
                          onValueChange={setSubdomain}
                          onSubmit={handlePublish}
                          placeholder="your-name"
                          className="rounded-r-none border-r-0 font-mono text-sm"
                        />
                        <span className="flex h-9 items-center rounded-r-md border border-input bg-muted px-3 text-sm text-muted-foreground font-mono whitespace-nowrap">
                          .vibecodes.space
                        </span>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handlePublish()}
                        disabled={publishing || !subdomain.trim()}
                      >
                        {publishing ? 'Updating…' : 'Update address & publish'}
                      </Button>
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}

          {/* ── First-time publish form ── */}
          {phase === 'form' && (
            <>
              <DialogHeader>
                <DialogTitle>Publish your site</DialogTitle>
                <DialogDescription>
                  Choose a subdomain — your site will be live at{' '}
                  <span className="font-mono text-foreground">[name].vibecodes.space</span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Site address</Label>
                  <div className="flex items-center gap-0">
                    <SubdomainInput
                      id="subdomain"
                      initialValue={subdomain}
                      onValueChange={setSubdomain}
                      onSubmit={handlePublish}
                      placeholder="your-name"
                      className="rounded-r-none border-r-0 font-mono"
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
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                  <Button onClick={() => handlePublish()} disabled={publishing || !subdomain.trim()}>
                    {publishing ? 'Publishing…' : 'Publish'}
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
                  Checking every 30 seconds until your site is fully reachable.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 pt-2">
                <div className="rounded-lg bg-muted px-4 py-3 font-mono text-sm break-all text-center">
                  {url}
                </div>
                <div className="space-y-2 text-sm">
                  <StatusRow done label="Subdomain claimed" />
                  <StatusRow done label="Site content published" />
                  <StatusRow done={dnsReady} spinning={dnsSpinning} muted={false} label="DNS propagating" />
                  <StatusRow done={sslReady} spinning={sslSpinning} muted={!dnsReady} label="SSL certificate active" />
                  <StatusRow done={siteReady} spinning={siteSpinning} muted={!sslReady} label="Site reachable" />
                </div>
                <div className="rounded-lg bg-muted/60 px-4 py-3 text-xs text-muted-foreground space-y-1">
                  {probeStage === 'dns' && (
                    <p>⏳ Waiting for DNS to propagate — this can take a few minutes to a few hours.</p>
                  )}
                  {probeStage === 'ssl' && (
                    <p>🔐 DNS is live! Waiting for SSL certificate — usually under 2 minutes.</p>
                  )}
                  {probeStage === 'unknown' && (
                    <p>🔄 Checking… still propagating.</p>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    Next check in <span className="font-mono font-semibold text-foreground">{countdown}s</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {attempts > 0 ? elapsedLabel : 'First check…'}
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

function SubdomainInput({
  initialValue,
  onValueChange,
  onSubmit,
  ...props
}: {
  initialValue: string
  onValueChange: (value: string) => void
  onSubmit: (value: string) => void
} & Omit<ComponentProps<typeof Input>, 'value' | 'defaultValue' | 'onChange' | 'onKeyDown' | 'onSubmit'>) {
  const [value, setValue] = useState(initialValue)
  const commitRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (commitRef.current) clearTimeout(commitRef.current)
  }, [])

  function commit(next: string) {
    if (commitRef.current) clearTimeout(commitRef.current)
    onValueChange(next)
  }

  function handleChange(next: string) {
    const normalized = next.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setValue(normalized)
    if (commitRef.current) clearTimeout(commitRef.current)
    commitRef.current = setTimeout(() => onValueChange(normalized), SUBDOMAIN_INPUT_DELAY)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    commit(value)
    onSubmit(value)
  }

  return <Input {...props} value={value} onChange={(event) => handleChange(event.target.value)} onKeyDown={handleKeyDown} />
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
      <span className="w-5 text-center text-base leading-none shrink-0">
        {done ? '✓' : spinning ? <Spinner /> : '·'}
      </span>
      <span className={done ? 'text-foreground' : spinning ? 'text-foreground font-medium' : muted ? 'text-muted-foreground/50' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="inline-block animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}
