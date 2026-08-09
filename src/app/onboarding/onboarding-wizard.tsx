'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Textarea } from '@/components/ui/textarea'

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState('')
  const [source, setSource] = useState('')
  const [profileContext, setProfileContext] = useState('')
  const [theme, setTheme] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = () => {
    setError(null)
    setStep(s => s + 1)
  }
  const handlePrev = () => {
    setError(null)
    setStep(s => s - 1)
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const { completeOnboarding } = await import('./actions')
      const result = await completeOnboarding({ goal, source, theme, profileContext })
      
      if (result?.error) {
        if (result.error === 'plan_limit') {
          router.push('/pricing?reason=site_limit')
          return
        }
        setError(result.error)
        setIsSubmitting(false)
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('NEXT_REDIRECT')) {
        console.error('Onboarding Client Error:', err)
        setError(err.message || 'An unexpected error occurred during setup.')
        setIsSubmitting(false)
      }
    }
  }

  const isStep2Disabled = step === 2 && (
    !source || 
    (source === 'linkedin' && (!profileContext || profileContext === 'https://linkedin.com/in/')) ||
    (source === 'resume' && !profileContext)
  )

  return (
    <Card className="w-full max-w-2xl shadow-lg border-muted">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome to VibeCodes!</CardTitle>
        <CardDescription>
          Let&apos;s set up your first website. Step {step} of 3.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[300px]">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-medium">What is your main goal?</h3>
            <div className="grid grid-cols-2 gap-4">
              {['Portfolio', 'Resume Site', 'Founder Page', 'Freelancer Page'].map(g => (
                <div 
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${goal === g ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' : 'hover:border-primary/50 bg-card hover:bg-accent/20'}`}
                >
                  <span className="font-semibold">{g}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-medium">Connect your professional profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'linkedin', title: 'LinkedIn', desc: 'Pre-fill from URL' },
                { id: 'resume', title: 'Resume Text', desc: 'Paste your resume' },
                { id: 'manual', title: 'Manual', desc: 'Start from scratch' }
              ].map(s => (
                <div 
                  key={s.id}
                  onClick={() => {
                    setSource(s.id)
                    if (s.id === 'linkedin' && !profileContext) {
                      setProfileContext('https://linkedin.com/in/')
                    }
                  }}
                  className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${source === s.id ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' : 'hover:border-primary/50 bg-card hover:bg-accent/20'}`}
                >
                  <div className="font-semibold mb-1">{s.title}</div>
                  <div className="text-sm text-muted-foreground">{s.desc}</div>
                </div>
              ))}
            </div>
            
            {source === 'linkedin' && (
              <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <Label>LinkedIn URL</Label>
                <Input 
                  value={profileContext} 
                  onChange={(e) => setProfileContext(e.target.value)} 
                  placeholder="username" 
                />
                <p className="text-xs text-muted-foreground italic">Our AI will use this link to craft your custom site.</p>
              </div>
            )}
            {source === 'resume' && (
              <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <Label>Paste Resume Content</Label>
                <Textarea 
                  placeholder="Paste your professional summary, work history, and skills..." 
                  className="min-h-[200px]"
                  onChange={(e) => setProfileContext(e.target.value)}
                />
              </div>
            )}
            {source === 'manual' && (
              <div className="mt-6 p-4 bg-muted/20 border rounded-lg text-sm italic">
                No problem! You can edit everything manually in the builder.
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-medium">Choose a starting theme</h3>
            <div className="grid grid-cols-2 gap-4">
              {['Minimal Professional', 'Creative Portfolio', 'Startup Profile'].map(t => (
                <div 
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all h-32 flex items-center justify-center duration-200 ${theme === t ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary' : 'hover:border-primary/50 bg-card hover:bg-accent/20'}`}
                >
                  <span className="font-semibold text-lg">{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-muted/20 p-6 rounded-b-xl">
        <Button variant="outline" onClick={handlePrev} disabled={step === 1} className="w-24">Back</Button>
        {step < 3 ? (
          <Button onClick={handleNext} disabled={(step===1 && !goal) || isStep2Disabled} className="w-40">
            {step === 2 ? 'Continue to Themes' : 'Next Step'}
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={!theme || isSubmitting} className="w-40">
            {isSubmitting ? 'AI is Generating...' : 'Complete Setup'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
