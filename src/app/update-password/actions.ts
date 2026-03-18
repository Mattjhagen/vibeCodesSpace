'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  if (!password) {
    redirect('/update-password?message=Password is required')
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    redirect(`/update-password?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard')
}
