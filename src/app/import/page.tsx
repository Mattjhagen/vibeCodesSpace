import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ImportFlow } from './import-flow'

export default async function ImportPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-center p-4 bg-muted/20">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl font-bold mb-2">Import Profile Data</h1>
        <p className="text-muted-foreground mb-8">
          Upload your resume or provide your LinkedIn profile to kickstart your website with AI-generated content.
        </p>
        <ImportFlow />
      </div>
    </div>
  )
}
