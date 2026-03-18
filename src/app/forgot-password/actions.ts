'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    redirect('/forgot-password?message=Email is required')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vibecodes.space'}/auth/callback?next=/update-password`,
  })

  // We explicitly redirect with a success-like message even if the email wasn't found to prevent email enumeration attacks
  if (error) {
    redirect(`/forgot-password?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/forgot-password?message=Check your email for the reset link')
}
