'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type Source = 'website' | 'resume' | 'linkedin_pdf'

const THEMES = [
  { id: 'clean',    label: 'Clean White',  colors: ['#fff','#111','#111'] },
  { id: 'midnight', label: 'Midnight',     colors: ['#0F0F13','#fafafa','#7C3AED'] },
  { id: 'slate',    label: 'Slate',        colors: ['#F1F5F9','#0F172A','#3B82F6'] },
  { id: 'ocean',    label: 'Ocean Blue',   colors: ['#F0F7FF','#0A1628','#0369A1'] },
]

export function ImportFlow() {
  const router = useRouter()
  const [source, setSource] = useState<Source>('website')
  const [url, setUrl] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [theme, setTheme] = useState('clean')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (source === 'website') {
      setProgress('Fetching your site...')
      try {
        const res = await fetch('/api/migrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, theme }),
        })
        const data = await res.json()

        if (!res.ok) {
          if (data.error === 'plan_limit') {
            toast.error('Site limit reached — upgrade your plan to create more sites.')
          } else {
            toast.error(data.error || 'Migration failed')
          }
          setLoading(false)
          setProgress('')
          return
        }

        setProgress('Almost done...')
        toast.success('Site migrated! Taking you to the editor.')
        router.push(`/builder/${data.siteId}`)
      } catch {
        toast.error('Something went wrong — please try again.')
        setLoading(false)
        setProgress('')
      }
    } else {
      // Resume / LinkedIn PDF — use existing AI generation
      toast('AI generation from uploaded files coming soon.')
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Import & Migrate</CardTitle>
        <CardDescription>Bring your existing site or profile into vibeCodes in seconds.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Source selector */}
        <div>
          <Label className="mb-3 block">What would you like to import?</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'website' as Source,      emoji: '🌐', title: 'Existing Website',   desc: 'Enter your domain — we\'ll scrape and rebuild it' },
              { id: 'resume' as Source,       emoji: '📋', title: 'Resume / LinkedIn',  desc: 'Paste your resume or LinkedIn text' },
              { id: 'linkedin_pdf' as Source, emoji: '📄', title: 'LinkedIn PDF Export',desc: 'Upload your LinkedIn profile PDF' },
            ].map(s => (
              <div
                key={s.id}
                onClick={() => setSource(s.id)}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${source === s.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50 bg-card'}`}
              >
                <div className="text-2xl mb-2">{s.emoji}</div>
                <div className="font-semibold text-sm mb-1">{s.title}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <form id="import-form" onSubmit={handleSubmit} className="space-y-4">

          {/* Website URL */}
          {source === 'website' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <Label>Your current website URL</Label>
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="yoursite.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                We'll fetch your site, extract all your content, and use AI to rebuild it as a fresh vibeCodes site you can fully customize.
              </p>
              <div className="rounded-lg bg-muted/30 border p-3 space-y-1 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">What gets migrated:</p>
                <p>✓ Your name, tagline, and about text</p>
                <p>✓ Services, work, or products</p>
                <p>✓ Contact information</p>
                <p className="text-muted-foreground/60">✗ Images (you'll re-upload in the editor)</p>
                <p className="text-muted-foreground/60">✗ Sites that require login or JavaScript</p>
              </div>

              {/* Theme picker */}
              <div className="pt-2">
                <Label className="mb-2 block">Starting theme</Label>
                <div className="grid grid-cols-4 gap-2">
                  {THEMES.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${theme === t.id ? 'border-primary' : 'border-transparent hover:border-border'}`}
                    >
                      <div className="h-10 relative" style={{ background: t.colors[0] }}>
                        <div className="absolute inset-x-2 top-2 h-1.5 rounded-full" style={{ background: t.colors[2] }} />
                        <div className="absolute inset-x-2 top-5 h-1 rounded-full" style={{ background: t.colors[1], opacity: 0.3 }} />
                      </div>
                      <div className="p-1 text-center" style={{ background: t.colors[0] }}>
                        <span className="text-[9px]" style={{ color: t.colors[1] }}>{t.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Resume / LinkedIn text */}
          {source === 'resume' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <Label>Paste your resume or LinkedIn content</Label>
              <Textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your resume, LinkedIn About section, and work experience here..."
                className="min-h-[200px]"
                required
              />
              <p className="text-xs text-muted-foreground">The more detail you provide, the better your site content will be.</p>
            </div>
          )}

          {/* LinkedIn PDF */}
          {source === 'linkedin_pdf' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <Label>Upload LinkedIn PDF</Label>
              <p className="text-xs text-muted-foreground mb-2">
                On LinkedIn: Me → View Profile → More → Save to PDF. Then upload it here.
              </p>
              <Input type="file" accept=".pdf" required />
            </div>
          )}
        </form>

        {/* Progress */}
        {loading && progress && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground animate-in fade-in">
            <span className="spinner" />
            {progress}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t bg-muted/20 p-6 flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          {source === 'website' ? 'Takes ~15 seconds' : 'Takes ~10 seconds'}
        </p>
        <Button type="submit" form="import-form" disabled={loading} className="w-40">
          {loading ? <><span className="spinner mr-2" />Migrating…</> : source === 'website' ? '🌐 Migrate Site' : '✨ Generate Site'}
        </Button>
      </CardFooter>
    </Card>
  )
}
