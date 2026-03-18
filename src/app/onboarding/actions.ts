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
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
      id: user.id, 
      onboarding_completed: true, 
      full_name: user.email?.split('@')[0] || 'User' 
    })

  if (profileError) {
    console.error('Onboarding Profile Error:', profileError)
    throw new Error(`Failed to update profile: ${profileError.message}`)
  }

  // 2. Create workspace if they don't have one
  const { data: workspaces, error: workspaceQueryError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('user_id', user.id)

  if (workspaceQueryError) {
    console.error('Onboarding Workspace Query Error:', workspaceQueryError)
    throw new Error(`Failed to query workspace: ${workspaceQueryError.message}`)
  }

  if (!workspaces || workspaces.length === 0) {
    const { data: newWorkspace, error: workspaceInsertError } = await supabase
      .from('workspaces')
      .insert({ user_id: user.id, name: 'My Workspace' })
      .select('id')
      .single()
      
    if (workspaceInsertError) {
      console.error('Onboarding Workspace Insert Error:', workspaceInsertError)
      throw new Error(`Failed to create workspace: ${workspaceInsertError.message}`)
    }

    // 3. Create initial site with selected theme
    if (newWorkspace) {
      const { error: siteError } = await supabase
        .from('sites')
        .insert({
          workspace_id: newWorkspace.id,
          name: `${data.goal} Site`,
          theme: data.theme,
          status: 'draft'
        })
      
      if (siteError) {
        console.error('Onboarding Site Insert Error:', siteError)
        throw new Error(`Failed to create initial site: ${siteError.message}`)
      }
    }
  }

  redirect('/dashboard')
}
