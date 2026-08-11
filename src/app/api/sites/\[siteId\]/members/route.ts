import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase.from('site_members').select('role, created_at').eq('site_id', siteId),
    supabase.from('site_invitations').select('email, role, created_at, token').eq('site_id', siteId).is('accepted_at', null),
  ])

  return NextResponse.json({ members: members ?? [], invitations: invitations ?? [] })
}
