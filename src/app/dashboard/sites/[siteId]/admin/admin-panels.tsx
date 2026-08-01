'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Inbox, Users, BarChart3, ScrollText, XCircle, Loader2 } from 'lucide-react'
import { deleteSubmission, inviteMember, markSubmissionRead, removeMember, setMemberRole } from './actions'

type Role = 'owner' | 'admin' | 'editor' | 'viewer'

export type AdminData = {
  site: {
    id: string
    name: string
    status: string
    subdomain: string | null
    customDomain: string | null
    suspended: boolean
  }
  role: Role
  members: { userId: string; role: Role; since: string }[]
  invitations: { id: string; email: string; role: Role; expiresAt: string }[]
  submissions: {
    id: string
    payload: Record<string, string>
    pageSlug: string | null
    readAt: string | null
    createdAt: string
  }[]
  traffic: { day: string; path: string; views: number }[]
  audit: { id: string; actorId: string | null; action: string; target: string | null; createdAt: string }[]
  canManageMembers: boolean
  canSeeAudit: boolean
  canEdit: boolean
}

function Panel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Inbox
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5" /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function AdminPanels({ data }: { data: AdminData }) {
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor')
  const [pending, startTransition] = useTransition()

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null)
    startTransition(async () => {
      const r = await fn()
      if (!r.ok) setError(r.error ?? 'That did not work.')
    })
  }

  // Traffic is stored as one row per day/path. The admin wants both shapes:
  // the last 14 days as a trend, and the busiest paths overall.
  const byDay = new Map<string, number>()
  const byPath = new Map<string, number>()
  for (const t of data.traffic) {
    byDay.set(t.day, (byDay.get(t.day) ?? 0) + t.views)
    byPath.set(t.path, (byPath.get(t.path) ?? 0) + t.views)
  }
  const days = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-14)
  const peak = Math.max(1, ...days.map(([, v]) => v))
  const topPaths = [...byPath.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const totalViews = [...byPath.values()].reduce((a, b) => a + b, 0)
  const unread = data.submissions.filter((s) => !s.readAt).length

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive border border-destructive/20 bg-destructive/10 rounded-lg p-3">
          <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data.site.suspended && (
        <div className="text-sm rounded-lg p-3 bg-destructive/10 text-destructive border border-destructive/20">
          This site is suspended. It is not being served and cannot accept form submissions.
        </div>
      )}

      <Panel
        icon={BarChart3}
        title="Traffic"
        description={`${totalViews.toLocaleString()} page views recorded`}
      >
        {days.length === 0 ? (
          <p className="text-sm text-muted-foreground">No page views recorded yet.</p>
        ) : (
          <>
            <div className="flex items-end gap-1 h-24 mb-4" role="img" aria-label="Daily page views">
              {days.map(([day, views]) => (
                <div key={day} className="flex-1 flex flex-col justify-end" title={`${day}: ${views}`}>
                  <div
                    className="bg-foreground/80 rounded-sm min-h-[2px]"
                    style={{ height: `${(views / peak) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <table className="w-full text-sm">
              <tbody>
                {topPaths.map(([path, views]) => (
                  <tr key={path} className="border-b last:border-b-0">
                    <td className="py-1.5 font-mono text-muted-foreground truncate">{path}</td>
                    <td className="py-1.5 text-right tabular-nums">{views.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Panel>

      <Panel
        icon={Inbox}
        title="Form submissions"
        description={unread ? `${unread} unread` : 'Everything read'}
      >
        {data.submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No submissions yet. Forms post to{' '}
            <code className="font-mono text-xs">/api/forms/{data.site.id}</code>.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.submissions.map((s) => (
              <li
                key={s.id}
                className={`border rounded-lg p-3 text-sm ${s.readAt ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <dl className="grid grid-cols-[minmax(0,8rem)_1fr] gap-x-3 gap-y-1">
                      {Object.entries(s.payload).map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt className="text-muted-foreground truncate">{k}</dt>
                          <dd className="break-words">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(s.createdAt).toLocaleString()}
                      {s.pageSlug ? ` · /${s.pageSlug}` : ''}
                    </p>
                  </div>
                  {data.canEdit && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => markSubmissionRead(data.site.id, s.id, !s.readAt))}
                      >
                        {s.readAt ? 'Unread' : 'Read'}
                      </Button>
                      {data.canManageMembers && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => run(() => deleteSubmission(data.site.id, s.id))}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        icon={Users}
        title="People"
        description="Who can work on this site, and what they can do"
      >
        <ul className="space-y-2 mb-4">
          {data.members.length === 0 && (
            <li className="text-sm text-muted-foreground">
              No invited members. You have access as the site owner.
            </li>
          )}
          {data.members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between gap-4 text-sm border-b pb-2">
              <span className="font-mono text-xs truncate">{m.userId}</span>
              <div className="flex items-center gap-2 shrink-0">
                {data.canManageMembers ? (
                  <select
                    defaultValue={m.role}
                    disabled={pending}
                    aria-label={`Role for ${m.userId}`}
                    className="border rounded px-2 py-1 bg-background text-sm"
                    onChange={(e) =>
                      run(() => setMemberRole(data.site.id, m.userId, e.target.value as Role))
                    }
                  >
                    {(['owner', 'admin', 'editor', 'viewer'] as Role[]).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-muted-foreground">{m.role}</span>
                )}
                {data.canManageMembers && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => removeMember(data.site.id, m.userId))}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {data.invitations.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-1">Pending invitations</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              {data.invitations.map((i) => (
                <li key={i.id}>
                  {i.email} — {i.role}, expires {new Date(i.expiresAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.canManageMembers && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="teammate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'admin' | 'editor' | 'viewer')}
              aria-label="Role for the invited person"
              className="border rounded-md px-3 py-2 bg-background text-sm"
            >
              <option value="admin">admin</option>
              <option value="editor">editor</option>
              <option value="viewer">viewer</option>
            </select>
            <Button
              disabled={pending || !email}
              className="shrink-0"
              onClick={() => {
                setError(null)
                setInviteLink(null)
                startTransition(async () => {
                  const r = await inviteMember(data.site.id, email, inviteRole)
                  if (!r.ok) setError(r.error)
                  else {
                    setEmail('')
                    setInviteLink(`${window.location.origin}/invite/${r.token}`)
                  }
                })
              }}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite'}
            </Button>
          </div>
        )}

        {inviteLink && (
          <div className="mt-3 text-sm rounded-lg p-3 bg-muted">
            <p className="mb-1">
              Send them this link. It only works for the address you invited, and expires in 7 days.
            </p>
            <code className="font-mono text-xs break-all">{inviteLink}</code>
            <p className="text-xs text-muted-foreground mt-2">
              Invitation emails are not sent automatically — no email provider is configured yet.
            </p>
          </div>
        )}
      </Panel>

      {data.canSeeAudit && (
        <Panel icon={ScrollText} title="Activity" description="Who did what, and when">
          {data.audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {data.audit.map((a) => (
                <li key={a.id} className="flex items-baseline justify-between gap-4 border-b pb-1">
                  <span>
                    <span className="font-mono text-xs">{a.action}</span>
                    {a.target && <span className="text-muted-foreground"> · {a.target}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {data.canEdit && (
        <Panel icon={ScrollText} title="Content" description="Pages, sections and blocks">
          <Link href={`/builder/${data.site.id}`}>
            <Button variant="outline">Open the editor</Button>
          </Link>
        </Panel>
      )}
    </div>
  )
}
