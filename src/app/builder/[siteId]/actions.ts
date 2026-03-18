'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSiteContent(siteId: string, content: any) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('sites')
    .update({ content })
    .eq('id', siteId)

  if (error) {
    console.error('Update Site Content Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/builder/${siteId}`)
  return { success: true }
}
