'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SITE_THEMES } from '@/lib/site-themes'

// Goal → { siteType, themeId, templateHint }
const GOALS = [
  { id: 'portfolio',    label: 'Creative Portfolio',   emoji: '🎨', desc: 'Showcase your work and projects',        siteType: 'portfolio', themeId: 'midnight' },
  { id: 'resume',       label: 'Resume / CV',           emoji: '📄', desc: 'Professional profile and experience',   siteType: 'portfolio', themeId: 'clean'    },
  { id: 'freelancer',   label: 'Freelancer',            emoji: '💼', desc: 'Services, rates, and booking',          siteType: 'services',  themeId: 'slate'    },
  { id: 'founder',      label: 'Founder Page',          emoji: '🚀', desc: 'Personal brand for builders',           siteType: 'portfolio', themeId: 'graphite' },
  { id: 'business',     label: 'Business / Agency',     emoji: '🏢', desc: 'Services and company overview',         siteType: 'business',  themeId: 'ocean'    },
  { id: 'restaurant',   label: 'Restaurant / Food',     emoji: '🍽️', desc: 'Menu, hours, and reservations',         siteType: 'business',  themeId: 'coral'    },
  { id: 'coach',        label: 'Coach / Consultant',    emoji: '🎯', desc: 'Programs, credentials, and booking',    siteType: 'services',  themeId: 'forest'   },
  { id: 'musician',     label: 'Musician / Artist',     emoji: '🎵', desc: 'Music, events, and press kit',          siteType: 'portfolio', themeId: 'midnight' },
]

const THEME_PREVIEWS = [
  { id: 'clean',    label: 'Clean White',   palette: ['#ffffff','#111111','#111111'] },
  { id: 'midnight', label: 'Midnight',      palette: ['#0F0F13','#FAFAFA','#7C3AED'] },
  { id: 'slate',    label: 'Slate',         palette: ['#F1F5F9','#0F172A','#3B82F6'] },
  { id: 'warm',     label: 'Warm Linen',    palette: ['#FAF7F2','#2C1A0E','#7C4D2E'] },
  { id: 'coral',    label: 'Coral Sunset',  palette: ['#FFF8F6','#1A1A1A','#E54D2E'] },
  { id: 'forest',   label: 'Forest',        palette: ['#F4F7F0','#1A2E1A','#166534'] },
  { id: 'graphite', label: 'Graphite',      palette: ['#18181B','#F4F4F5','#A1A1AA'] },
  { id: 'ocean',    label: 'Ocean Blue',    palette: ['#F0F7FF','#0A1628','#0369A1'] },
]

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState<typeof GOALS[0] | null>(null)
  const [source, setSource] = useState('')
  const [profileContext, setProfileContext] = useState('')
  const [theme, setTheme] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-set theme when goal is picked
  const selectGoal = (g: typeof GOALS[0]) => {
    setGoal(g)
    setTheme(g.themeId)
  }

  const handleNext = () => { setError(null); setStep(s => s + 1) }
  const handlePrev = () => { setError(null); setStep(s => s - 1) }

  const handleComplete = async () => {
    if (!goal) return
    setIsSubmitting(true)
    setError(null)
    try {
      const { completeOnboarding } = await import('./actions')
      const result = await completeOnboarding({
        goal: goal.label,
        source,
        theme,
        profileContext,
        siteType: goal.siteType as any,
      })
      if (result?.error) {
        if (result.error === 'plan_limit') { router.push('/pricing?reason=site_limit'); return }
        setError(result.error)
        setIsSubmitting(false)
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('NEXT_REDIRECT')) {
        setError(err.message || 'An unexpected error occurred.')
        setIsSubmitting(false)
      }
    }
  }

  const isStep2Disabled = step === 2 && (
    !source ||
    ((source === 'linkedin' || source === 'resume') && !profileContext)
  )

  return (
    <Card className="w-full max-w-2xl shadow-lg border-muted">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome to VibeCodes!</CardTitle>
        <CardDescription>Let&apos;s set up your first website. Step {step} of 3.</CardDescription>
      </CardHeader>

      <CardContent className="min-h-[340px]">

        {/* STEP 1 — What kind of site */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-medium">What kind of site do you need?</h3>
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map(g => (
                <div
                  key={g.id}
                  onClick={() => selectGoal(g)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${goal?.id === g.id ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' : 'hover:border-primary/50 bg-card hover:bg-accent/20'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{g.emoji}</span>
                    <span className="font-semibold text-sm">{g.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{g.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Content source */}
        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-medium">How should we build your <span className="text-primary">{goal?.label}</span>?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'linkedin', title: '🔗 LinkedIn', desc: 'Paste your LinkedIn About & experience' },
                { id: 'resume',   title: '📋 Resume',   desc: 'Paste your resume — AI builds the site' },
                { id: 'manual',   title: '✏️ Manual',   desc: 'Start with a blank template' },
              ].map(s => (
                <div
                  key={s.id}
                  onClick={() => setSource(s.id)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${source === s.id ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' : 'hover:border-primary/50 bg-card hover:bg-accent/20'}`}
                >
                  <div className="font-semibold mb-1 text-sm">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
              ))}
            </div>
            {source === 'linkedin' && (
              <div className="mt-4 space-y-2 animate-in fade-in duration-200">
                <Label>Paste your LinkedIn About section & experience</Label>
                <p className="text-xs text-muted-foreground">Go to your LinkedIn profile → click "About" → copy the text. Then copy your Experience section too. Paste it all below.</p>
                <Textarea
                  placeholder="Paste your LinkedIn About section and work experience here..."
                  className="min-h-[160px]"
                  onChange={e => setProfileContext(e.target.value)}
                />
                <p className="text-xs text-muted-foreground italic">Our AI will use this to write your site content automatically.</p>
              </div>
            )}
            {source === 'resume' && (
              <div className="mt-4 space-y-2 animate-in fade-in duration-200">
                <Label>Paste your resume</Label>
                <Textarea placeholder="Paste your professional summary, work history, and skills..." className="min-h-[160px]" onChange={e => setProfileContext(e.target.value)} />
              </div>
            )}
            {source === 'manual' && (
              <div className="mt-4 p-4 bg-muted/20 border rounded-lg text-sm text-muted-foreground">
                We&apos;ll pre-fill a <strong>{goal?.label}</strong> template for you — just edit the text and swap in your photos.
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — Theme */}
        {step === 3 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-lg font-medium">Choose your look</h3>
              <p className="text-sm text-muted-foreground mt-1">We picked <span className="text-primary font-medium">{THEME_PREVIEWS.find(t => t.id === theme)?.label}</span> for your {goal?.label} — change it any time in the builder.</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {THEME_PREVIEWS.map(t => (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all duration-200 ${theme === t.id ? 'border-primary shadow-md' : 'border-transparent hover:border-border'}`}
                >
                  {/* Swatch */}
                  <div className="h-14 relative" style={{ background: t.palette[0] }}>
                    <div className="absolute inset-x-3 top-3 h-2 rounded-full" style={{ background: t.palette[2], opacity: 0.9 }} />
                    <div className="absolute inset-x-3 top-7 h-1.5 rounded-full" style={{ background: t.palette[1], opacity: 0.4 }} />
                    <div className="absolute inset-x-5 top-10 h-1 rounded-full" style={{ background: t.palette[1], opacity: 0.25 }} />
                  </div>
                  <div className="p-1.5 text-center" style={{ background: t.palette[0] }}>
                    <span className="text-[10px] font-medium" style={{ color: t.palette[1] }}>{t.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in duration-200">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t bg-muted/20 p-6 rounded-b-xl">
        <Button variant="outline" onClick={handlePrev} disabled={step === 1} className="w-24">Back</Button>
        {step < 3 ? (
          <Button onClick={handleNext} disabled={(step === 1 && !goal) || isStep2Disabled} className="w-40">
            {step === 2 ? 'Choose a Theme →' : 'Next Step →'}
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={!theme || isSubmitting} className="w-40">
            {isSubmitting ? 'Building your site…' : 'Create My Site →'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
