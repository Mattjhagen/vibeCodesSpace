import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { planForWorkspace } from '@/lib/generation-limits'
import { DomainsPage } from './domains-client'

export default async function DomainsPageWrapper() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  const workspace = workspaces?.[0]

  if (workspace) {
    const plan = await planForWorkspace(supabase, workspace.id)
    if (plan !== 'business') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <h1 className="text-2xl font-bold">Custom Domains — Business Plan</h1>
          <p className="text-muted-foreground max-w-md">
            Register a new domain or connect one you already own directly inside vibeCodes. Included in the Business plan at $49/mo.
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

  return <DomainsPage />
}
