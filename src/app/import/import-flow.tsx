'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function ImportFlow() {
  const [source, setSource] = useState<'linkedin_url' | 'resume_file' | 'linkedin_pdf'>('resume_file')
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    
    // Mock the extraction pipeline
    toast('Parsing document and extracting entities...')
    await new Promise(r => setTimeout(r, 1500))
    toast.success('Successfully extracted 4 work experiences and 8 skills!')
    
    // Redirect to builder/editor for review
    setIsUploading(false)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Data Source</CardTitle>
        <CardDescription>Select where we should pull your professional history from.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div 
            onClick={() => setSource('resume_file')}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${source === 'resume_file' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
          >
            <div className="font-semibold mb-1">Upload Resume</div>
            <div className="text-xs text-muted-foreground">PDF, DOCX, TXT</div>
          </div>
          <div 
            onClick={() => setSource('linkedin_pdf')}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${source === 'linkedin_pdf' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
          >
            <div className="font-semibold mb-1">LinkedIn PDF</div>
            <div className="text-xs text-muted-foreground">Export from LinkedIn</div>
          </div>
          <div 
            onClick={() => setSource('linkedin_url')}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${source === 'linkedin_url' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
          >
            <div className="font-semibold mb-1">LinkedIn URL</div>
            <div className="text-xs text-muted-foreground">Public profile link</div>
          </div>
        </div>

        <form id="import-form" onSubmit={handleUpload} className="space-y-4">
          {(source === 'resume_file' || source === 'linkedin_pdf') && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-bottom-2">
              <Label htmlFor="file">Select File</Label>
              <Input id="file" type="file" accept=".pdf,.docx,.txt" required />
            </div>
          )}
          {source === 'linkedin_url' && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-bottom-2">
              <Label htmlFor="url">Profile URL</Label>
              <Input 
                id="url" 
                type="text" 
                defaultValue="https://linkedin.com/in/" 
                placeholder="username" 
                required 
              />
              <p className="text-xs text-muted-foreground">We use a compliant import method that requires you to follow guided steps.</p>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="border-t bg-muted/20 p-6 flex justify-end">
        <Button type="submit" form="import-form" disabled={isUploading}>
          {isUploading ? 'Extracting Data...' : 'Start Import'}
        </Button>
      </CardFooter>
    </Card>
  )
}
