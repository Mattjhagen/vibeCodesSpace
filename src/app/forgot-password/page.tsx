'use client'

import { useState } from 'react'
import { resetPassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    const result = await resetPassword(formData)
    setLoading(false)
    if ('success' in result) {
      setSubmitted(true)
      toast.success('Check your email for the reset link', {
        description: 'If an account exists for that address, a reset link is on its way.',
        duration: 8000,
      })
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your email and we will send you a secure link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="grid gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                Check your inbox for a reset link.
              </p>
              <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                Back to Login
              </Link>
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full font-semibold"
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </Button>
              <div className="text-center mt-2">
                <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
