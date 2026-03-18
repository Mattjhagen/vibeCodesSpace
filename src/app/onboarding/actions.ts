'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function completeOnboarding(data: { goal: string; source: string; theme: string; profileContext?: string }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    // 1. Create Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: user.email?.split('@')[0] || 'User',
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile Update Error:', profileError)
      return { error: `Profile update failed: ${profileError.message}` }
    }

    // 2. Get or Create Workspace
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    let workspaceId = workspaces?.[0]?.id

    if (!workspaceId) {
      const { data: newWorkspace, error: workspaceInsertError } = await supabase
        .from('workspaces')
        .insert({
          user_id: user.id,
          name: 'My Workspace'
        })
        .select()
        .single()

      if (workspaceInsertError) {
        console.error('Workspace Creation Error:', workspaceInsertError)
        return { error: `Workspace creation failed: ${workspaceInsertError.message}` }
      }
      workspaceId = newWorkspace.id
    }

    // 3. Create initial site with selected theme and generated content
    if (workspaceId) {
      let initialContent;
      if (data.profileContext && data.profileContext.length > 10) {
        const { generateSiteWithAI } = await import('@/lib/openai')
        initialContent = await generateSiteWithAI(data.goal, data.profileContext)
      } else {
        const { generateInitialContent } = await import('@/lib/site-generation')
        initialContent = generateInitialContent(data.goal, data.theme)
      }

      const { error: siteError } = await supabase
        .from('sites')
        .insert({
          workspace_id: workspaceId,
          name: `${data.goal} Site`,
          theme: data.theme,
          status: 'draft',
          content: initialContent
        })
        
      if (siteError) {
        console.error('Initial Site Creation Error:', siteError)
        return { error: `Initial site creation failed: ${siteError.message}` }
      }
    }
  } catch (err: any) {
    if (err.digest?.indexOf('NEXT_REDIRECT') === 0) throw err;
    console.error('Onboarding Logic Error:', err)
    return { error: err.message || 'An unexpected setup error occurred' }
  }

  redirect('/dashboard')
}
