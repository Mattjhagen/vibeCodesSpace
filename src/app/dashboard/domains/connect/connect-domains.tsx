'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckCircle2, Globe, Loader2, XCircle, Clock } from 'lucide-react'
import { checkDomain, connectDomain, disconnectDomain } from './actions'

export type DnsInstructions = {
  ownership: { type: string; name: string; value: string }
  pointing: { type: string; name: string; values: string[] }
}

export type DomainRow = {
  host: string
  siteId: string
  siteName: string
  connected: boolean
  certificateStatus: string
  certificateDetail: string | null
  lastCheckedAt: string | null
  lastReason: string | null
  lastDetail: string | null
  instructions: DnsInstructions
}

type SiteOption = { id: string; name: string; status: string }

/** One row of the "add this record" table. */
function RecordRow({ type, name, value }: { type: string; name: string; value: string }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] sm:grid-cols-[5rem_16rem_1fr] gap-x-4 gap-y-1 py-2 border-b last:border-b-0 text-sm">
      <span className="font-mono font-semibold">{type}</span>
      <span className="font-mono break-all text-muted-foreground">{name}</span>
      <span className="font-mono break-all col-span-2 sm:col-span-1">{value}</span>
    </div>
  )
}

function StatusBadge({ domain }: { domain: DomainRow }) {
  if (domain.connected && domain.certificateStatus === 'issued') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Live
      </span>
    )
  }
  if (domain.connected) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
        <Clock className="h-3.5 w-3.5" /> Issuing certificate
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
      <Clock className="h-3.5 w-3.5" /> Waiting for DNS
    </span>
  )
}

export function ConnectDomains({
  sites,
  domains,
}: {
  sites: SiteOption[]
  domains: DomainRow[]
}) {
  const [siteId, setSiteId] = useState(sites[0]?.id ?? '')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Keyed by host: the result of the last "check again", which is more current
  // than the server-rendered row and carries the specific reason.
  const [checks, setChecks] = useState<
    Record<string, { detail: string; verified: boolean; certificate: string }>
  >({})
  const [checking, setChecking] = useState<string | null>(null)

  const submit = () => {
    setError(null)
    if (!siteId) {
      setError('Create a site before connecting a domain.')
      return
    }
    startTransition(async () => {
      const result = await connectDomain(siteId, value)
      if (!result.ok) setError(result.error)
      else setValue('')
    })
  }

  const recheck = (host: string) => {
    setChecking(host)
    startTransition(async () => {
      const result = await checkDomain(host)
      setChecking(null)
      if (!result.ok) {
        setChecks((c) => ({
          ...c,
          [host]: { detail: result.error, verified: false, certificate: 'failed' },
        }))
        return
      }
      // Show the failing half — that is the one with an action attached.
      const failing = !result.ownership.verified ? result.ownership : result.pointing
      setChecks((c) => ({
        ...c,
        [host]: {
          detail: result.connected ? result.certificate.detail : failing.detail,
          verified: result.connected,
          certificate: result.certificate.status,
        },
      }))
    })
  }

  const remove = (host: string) => {
    startTransition(async () => {
      const result = await disconnectDomain(host)
      if (!result.ok) setError(result.error ?? 'Could not disconnect that domain.')
    })
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" /> Add a domain
          </CardTitle>
          <CardDescription>
            Enter a domain you already own. You will be given two DNS records to add at
            your registrar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="border rounded-md px-3 py-2 bg-background text-sm sm:w-56"
              aria-label="Site to connect the domain to"
            >
              {sites.length === 0 && <option value="">No sites yet</option>}
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="example.com"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <Button onClick={submit} disabled={pending || !value} className="shrink-0">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add domain'}
            </Button>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {domains.map((domain) => {
        const check = checks[domain.host]
        // Prefer the just-run check; fall back to what the last one recorded.
        const detail = check?.detail ?? domain.lastDetail ?? domain.certificateDetail
        return (
          <Card key={domain.host} className="shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="font-mono text-lg">{domain.host}</CardTitle>
                  <CardDescription>Connected to {domain.siteName}</CardDescription>
                </div>
                <StatusBadge domain={domain} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  1. Prove you own it — add this TXT record
                </h3>
                <div className="border rounded-lg px-4">
                  <RecordRow
                    type={domain.instructions.ownership.type}
                    name={domain.instructions.ownership.name}
                    value={domain.instructions.ownership.value}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">
                  2. Point it here — add {domain.instructions.pointing.values.length > 1 ? 'these' : 'this'}{' '}
                  {domain.instructions.pointing.type} record
                  {domain.instructions.pointing.values.length > 1 ? 's' : ''}
                </h3>
                <div className="border rounded-lg px-4">
                  {domain.instructions.pointing.values.map((v) => (
                    <RecordRow
                      key={v}
                      type={domain.instructions.pointing.type}
                      name={domain.instructions.pointing.name}
                      value={v}
                    />
                  ))}
                </div>
              </div>

              {detail && (
                <div
                  className={`flex items-start gap-2 text-sm rounded-lg p-3 ${
                    domain.connected || check?.verified
                      ? 'bg-green-500/10 text-green-700'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {domain.connected || check?.verified ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                  )}
                  <span>{detail}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => recheck(domain.host)}
                  disabled={pending}
                >
                  {checking === domain.host ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Check again'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(domain.host)}
                  disabled={pending}
                >
                  Disconnect
                </Button>
                {domain.lastCheckedAt && (
                  <span className="text-xs text-muted-foreground">
                    Last checked {new Date(domain.lastCheckedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
