import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './onboarding-wizard'

export default async function OnboardingPage(props: { searchParams: Promise<{ create?: string }> }) {
  const searchParams = await props.searchParams;
  const isCreating = searchParams.create === 'true'
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if already completed onboarding (unless intentionally creating a new site)
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed && !isCreating) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-center p-4 bg-muted/30">
      <OnboardingWizard />
    </div>
  )
}
