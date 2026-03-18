'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function completeOnboarding(data: { goal: string; source: string; theme: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Upsert profile
  await supabase
    .from('profiles')
    .upsert({ 
      id: user.id, 
      onboarding_completed: true, 
      full_name: user.email?.split('@')[0] || 'User' 
    })

  // 2. Create workspace if they don't have one
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)

  if (!workspaces || workspaces.length === 0) {
    const { data: newWorkspace } = await supabase
      .from('workspaces')
      .insert({ user_id: user.id, name: 'My Workspace' })
      .select('id')
      .single()
      
    // 3. Create initial site with selected theme
    if (newWorkspace) {
      await supabase
        .from('sites')
        .insert({
          workspace_id: newWorkspace.id,
          name: `${data.goal} Site`,
          theme: data.theme,
          status: 'draft'
        })
    }
  }

  redirect('/dashboard')
}
