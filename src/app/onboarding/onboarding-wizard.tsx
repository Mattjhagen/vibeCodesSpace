'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState('')
  const [source, setSource] = useState('')
  const [theme, setTheme] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNext = () => setStep(s => s + 1)
  const handlePrev = () => setStep(s => s - 1)

  const handleComplete = async () => {
    setIsSubmitting(true)
    const { completeOnboarding } = await import('./actions')
    await completeOnboarding({ goal, source, theme })
  }

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
            <h3 className="text-lg font-medium">How would you like to build your site?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'linkedin', title: 'LinkedIn Import', desc: 'Upload PDF or paste URL' },
                { id: 'resume', title: 'Resume Upload', desc: 'Upload PDF/DOCX' },
                { id: 'manual', title: 'Start from Scratch', desc: 'Build manually' }
              ].map(s => (
                <div 
                  key={s.id}
                  onClick={() => setSource(s.id)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${source === s.id ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' : 'hover:border-primary/50 bg-card hover:bg-accent/20'}`}
                >
                  <div className="font-semibold mb-1">{s.title}</div>
                  <div className="text-sm text-muted-foreground">{s.desc}</div>
                </div>
              ))}
            </div>
            {source === 'linkedin' && (
              <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <Label>LinkedIn Public URL</Label>
                <Input placeholder="https://linkedin.com/in/yourprofile" />
              </div>
            )}
            {source === 'resume' && (
              <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <Label>Upload Resume (PDF/DOCX)</Label>
                <Input type="file" />
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
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-muted/20 p-6 rounded-b-xl">
        <Button variant="outline" onClick={handlePrev} disabled={step === 1} className="w-24">Back</Button>
        {step < 3 ? (
          <Button onClick={handleNext} disabled={(step===1 && !goal) || (step===2 && !source)} className="w-24">Next</Button>
        ) : (
          <Button onClick={handleComplete} disabled={!theme || isSubmitting} className="w-40">
            {isSubmitting ? 'Saving...' : 'Complete Setup'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
