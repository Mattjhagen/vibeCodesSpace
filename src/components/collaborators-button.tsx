'use client'

import { useState } from 'react'
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
import { Users, Copy, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { PlanTier } from '@/lib/generation-limits'

interface Member {
  role: string
  created_at: string
  user?: { email?: string }
}

interface Invitation {
  email: string
  role: string
  created_at: string
  token: string
}

interface Props {
  siteId: string
  plan: PlanTier
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin:  'Can edit content, manage members, and change settings',
  editor: 'Can edit content only',
  viewer: 'Can preview the site but not make changes',
}

export function CollaboratorsButton({ siteId, plan }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('editor')
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  const isPaid = plan === 'pro' || plan === 'business'

  async function loadMembers() {
    if (dataLoaded) return
    try {
      const res = await fetch(`/api/sites/${siteId}/members`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members ?? [])
        setInvitations(data.invitations ?? [])
      }
    } catch { /* silent */ }
    setDataLoaded(true)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setInviteLink(null)

    try {
      const res = await fetch(`/api/sites/${siteId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Invite failed')
      } else {
        setInviteLink(`${window.location.origin}/invite/${data.token}`)
        setEmail('')
        setDataLoaded(false)
        await loadMembers()
        toast.success(`Invite sent to ${email}`)
      }
    } catch {
      toast.error('Something went wrong')
    }
    setLoading(false)
  }

  async function copyLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        title={isPaid ? 'Collaborators' : 'Collaborators — Pro plan required'}
        onClick={() => {
          if (!isPaid) {
            toast('Upgrade to Pro to invite collaborators')
            return
          }
          setOpen(true)
          loadMembers()
        }}
        className={!isPaid ? 'opacity-50' : ''}
      >
        <Users className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Collaborators</DialogTitle>
            <DialogDescription>
              Invite people to help edit this site. Each person gets their own login.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Invite form */}
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="grid gap-1.5">
                <Label>Email address</Label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label>Permission level</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['editor', 'admin', 'viewer'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${role === r ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Sending invite…' : 'Send Invite →'}
              </Button>
            </form>

            {/* Invite link */}
            {inviteLink && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Share this invite link — expires in 7 days:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs flex-1 truncate text-foreground font-mono">{inviteLink}</code>
                  <Button variant="ghost" size="icon" onClick={copyLink}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Current members */}
            {(members.length > 0 || invitations.length > 0) && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Current access</Label>
                <div className="space-y-1">
                  {members.map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20">
                      <span className="text-sm">{m.user?.email ?? 'Unknown'}</span>
                      <span className="text-xs font-medium capitalize text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{m.role}</span>
                    </div>
                  ))}
                  {invitations.map((inv, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20 opacity-60">
                      <span className="text-sm">{inv.email}</span>
                      <span className="text-xs text-muted-foreground">Pending · {inv.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Role reference */}
            <div className="rounded-lg border p-3 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Permission guide</p>
              {Object.entries(ROLE_DESCRIPTIONS).map(([r, desc]) => (
                <div key={r} className="flex gap-2 text-xs">
                  <span className="font-semibold w-12 capitalize shrink-0">{r}</span>
                  <span className="text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
