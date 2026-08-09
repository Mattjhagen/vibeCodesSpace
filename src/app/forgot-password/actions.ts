'use server'

import { createClient } from '@/utils/supabase/server'

export async function resetPassword(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vibecodes.space'}/auth/callback?next=/update-password`,
  })

  // Return success even when the email isn't found to prevent email enumeration
  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
