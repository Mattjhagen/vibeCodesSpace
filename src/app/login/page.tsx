'use client'

import { Suspense, useState } from 'react'
import { login, signup, loginWithGoogle } from './actions'
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
  const [loading, setLoading] = useState<'login' | 'signup' | 'google' | null>(null)

  async function handleAction(action: typeof login, type: 'login' | 'signup', formData: FormData) {
    setLoading(type)
    await action(formData)
    setLoading(null)
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login to Workspace</CardTitle>
          <CardDescription>
            Enter your email below to login to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginWithGoogle} className="mb-4">
            <Button
              type="submit"
              variant="outline"
              className="w-full gap-2.5 font-medium"
              disabled={loading !== null}
            >
              {loading === 'google' ? <><Spinner />Redirecting…</> : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
          </form>
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>
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
      <p className="text-xs text-muted-foreground text-center max-w-xs leading-relaxed">
        By continuing, you agree to our{' '}
        <a href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms of Service</a>
        {' '}and{' '}
        <a href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</a>.
      </p>
    </div>
  )
}
