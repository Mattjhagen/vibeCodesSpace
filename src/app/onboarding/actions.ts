'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function completeOnboarding(data: { goal: string; source: string; theme: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  try {
    // 1. Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id, 
        onboarding_completed: true, 
        full_name: user.email?.split('@')[0] || 'User' 
      })

    if (profileError) {
      return { error: `Profile update failed: ${profileError.message}` }
    }

    // 2. Create workspace if they don't have one
    const { data: workspaces, error: workspaceQueryError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id)

    if (workspaceQueryError) {
      return { error: `Workspace query failed: ${workspaceQueryError.message}` }
    }

    if (!workspaces || workspaces.length === 0) {
      const { data: newWorkspace, error: workspaceInsertError } = await supabase
        .from('workspaces')
        .insert({ user_id: user.id, name: 'My Workspace' })
        .select('id')
        .single()
        
      if (workspaceInsertError) {
        return { error: `Workspace creation failed: ${workspaceInsertError.message}` }
      }

      // 3. Create initial site with selected theme and generated content
      if (newWorkspace) {
        const { generateInitialContent } = await import('@/lib/site-generation')
        const initialContent = generateInitialContent(data.goal, data.theme)

        const { error: siteError } = await supabase
          .from('sites')
          .insert({
            workspace_id: newWorkspace.id,
            name: `${data.goal} Site`,
            theme: data.theme,
            status: 'draft',
            content: initialContent
          })
        
        if (siteError) {
          return { error: `Initial site creation failed: ${siteError.message}` }
        }
      }
    }
  } catch (err: any) {
    if (err.digest?.indexOf('NEXT_REDIRECT') === 0) throw err;
    return { error: err.message || 'An unexpected setup error occurred' }
  }

  redirect('/dashboard')
}
