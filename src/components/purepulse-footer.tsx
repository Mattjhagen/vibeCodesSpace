import { createClient } from '@/utils/supabase/server'
import { planForWorkspace } from '@/lib/generation-limits'

export async function PurePulseFooter() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (workspace) {
        const plan = await planForWorkspace(supabase, workspace.id)
        // Hide footer for paying customers
        if (plan === 'pro' || plan === 'business') return null
      }
    }
  } catch {
    // Not logged in or error — show footer (safe default)
  }

  return (
    <footer className="purepulse-footer">
      Powered by{' '}
      <a href="https://purepulse.one" target="_blank" rel="noopener">
        PurePulse.one
      </a>
    </footer>
  )
}
