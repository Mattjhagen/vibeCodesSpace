import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { planForWorkspace } from '@/lib/generation-limits'

export async function POST(req: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabase.from('workspaces').select('id').eq('user_id', user.id).maybeSingle()
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 400 })
  const plan = await planForWorkspace(supabase, workspace.id)
  if (plan === 'free') return NextResponse.json({ error: 'Upgrade to Pro to invite collaborators' }, { status: 403 })

  const { email, role } = await req.json()
  if (!email || !role) return NextResponse.json({ error: 'Email and role required' }, { status: 400 })

  const { data, error } = await supabase.rpc('invite_site_member', {
    p_site_id: siteId,
    p_email: email,
    p_role: role,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ token: data })
}
