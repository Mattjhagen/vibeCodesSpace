import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { dnsInstructions } from '@/lib/custom-domain'
import { ConnectDomains, type DomainRow } from './connect-domains'
import { planForWorkspace } from '@/lib/generation-limits'

export default async function ConnectDomainPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  const workspace = workspaces?.[0]

  // Custom domains are a Business plan feature
  if (workspace) {
    const plan = await planForWorkspace(supabase, workspace.id)
    if (plan !== 'business') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <h1 className="text-2xl font-bold">Custom Domains — Business Plan</h1>
          <p className="text-muted-foreground max-w-md">
            Connect your own domain (like <span className="font-mono">yourname.com</span>) to your vibeCodes site. This feature is included in the Business plan at $49/mo.
          </p>
          <Link href="/pricing" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90 transition">
            Upgrade to Business →
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition">
            ← Back to Dashboard
          </Link>
        </div>
      )
    }
  }
  const { data: sites } = workspace
    ? await supabase
        .from('sites')
        .select('id, name, subdomain, status')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  const { data: domains } = await supabase
    .from('custom_domains')
    .select(
      'host, site_id, is_apex, verification_token, connected, certificate_status, certificate_detail, last_checked_at, last_reason, last_detail',
    )
    .order('created_at', { ascending: false })

  const rows: DomainRow[] = (domains ?? []).map((d) => ({
    host: d.host,
    siteId: d.site_id,
    siteName: (sites ?? []).find((s) => s.id === d.site_id)?.name ?? 'Unknown site',
    connected: d.connected,
    certificateStatus: d.certificate_status,
    certificateDetail: d.certificate_detail,
    lastCheckedAt: d.last_checked_at,
    lastReason: d.last_reason,
    lastDetail: d.last_detail,
    instructions: dnsInstructions(d.host, d.is_apex, d.verification_token),
  }))

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Connect a domain</h1>
        </div>
        <p className="text-muted-foreground">
          Point a domain you already own at one of your sites. Looking to buy one instead?{' '}
          <Link href="/dashboard/domains" className="underline underline-offset-4">
            Search for a domain
          </Link>
          .
        </p>
      </div>

      <ConnectDomains
        sites={(sites ?? []).map((s) => ({ id: s.id, name: s.name, status: s.status }))}
        domains={rows}
      />
    </div>
  )
}
