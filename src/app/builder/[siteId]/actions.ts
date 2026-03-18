'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSiteContent(siteId: string, content: any, theme?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const dataToUpdate: any = { content, updated_at: new Date().toISOString() }
  if (theme) {
    dataToUpdate.theme = theme
  }

  const { error } = await supabase
    .from('sites')
    .update(dataToUpdate)
    .eq('id', siteId)

  if (error) {
    console.error('Update Site Content Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/builder/${siteId}`)
  return { success: true }
}
