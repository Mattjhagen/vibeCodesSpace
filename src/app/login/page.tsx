'use client'

import { Suspense, useState } from 'react'
import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSearchParams } from 'next/navigation'

function Spinner() {
  return (
    <svg
      className="inline-block animate-spin mr-2 -ml-1"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') ?? undefined
  const [loading, setLoading] = useState<'login' | 'signup' | null>(null)

  async function handleAction(action: typeof login, type: 'login' | 'signup', formData: FormData) {
    setLoading(type)
    await action(formData)
    setLoading(null)
  }

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login to Workspace</CardTitle>
          <CardDescription>
            Enter your email below to login to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
                disabled={loading !== null}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={loading !== null}
              />
            </div>
            {message && (
              <p className="text-sm font-medium text-destructive">{message}</p>
            )}
            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={loading !== null}
              formAction={(formData) => handleAction(login, 'login', formData)}
            >
              {loading === 'login' ? <><Spinner />Logging in…</> : 'Login'}
            </Button>
            <Button
              type="submit"
              variant="outline"
              className="w-full font-semibold"
              disabled={loading !== null}
              formAction={(formData) => handleAction(signup, 'signup', formData)}
            >
              {loading === 'signup' ? <><Spinner />Creating account…</> : 'Sign up'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
