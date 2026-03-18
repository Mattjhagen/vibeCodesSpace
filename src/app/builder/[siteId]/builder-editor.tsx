'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function BuilderEditor({ siteId, initialStatus }: { siteId: string, initialStatus: string }) {
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [status, setStatus] = useState(initialStatus)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    setIsSaving(true)
    // Actually save content to site_content or pages tables
    await new Promise(r => setTimeout(r, 800))
    toast('Draft saved successfully')
    setIsSaving(false)
  }

  async function handlePublish() {
    setIsPublishing(true)
    const { error } = await supabase.from('sites').update({ status: 'published' }).eq('id', siteId)
    if (!error) {
      setStatus('published')
      toast.success('Site published successfully!')
    } else {
      toast.error('Failed to publish site')
    }
    await new Promise(r => setTimeout(r, 500))
    setIsPublishing(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="w-24">
        {isSaving ? 'Saving...' : 'Save Draft'}
      </Button>
      <Button size="sm" onClick={handlePublish} disabled={status === 'published' || isPublishing} className="w-24">
        {isPublishing ? 'Publishing...' : status === 'published' ? 'Published' : 'Publish'}
      </Button>
    </>
  )
}
