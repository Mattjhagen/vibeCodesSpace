'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { SiteContent, parseSiteContent } from '@/lib/content-model'

export async function updateSiteContent(
  siteId: string,
  content: SiteContent,
  theme?: string,
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Validate server-side as well as in the editor. The client is not the
  // security boundary — this action is reachable directly, so everything that
  // reaches the database is sanitized here regardless of how it was sent.
  const safe = parseSiteContent(content)

  const dataToUpdate: Record<string, unknown> = {
    content: safe,
    updated_at: new Date().toISOString(),
  }
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

export async function updateSiteBranding(
  siteId: string,
  branding: { tab_title?: string; favicon_url?: string },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('sites')
    .update({ ...branding, updated_at: new Date().toISOString() })
    .eq('id', siteId)

  if (error) return { success: false, error: error.message }
  revalidatePath(`/builder/${siteId}`)
  return { success: true }
}
