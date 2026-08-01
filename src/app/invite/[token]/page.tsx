import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Redeeming a site invitation.
 *
 * Redemption happens server-side on load rather than behind a button. The
 * token is single-use and already scoped to one email address, so there is
 * nothing a confirmation step protects against — and a click-to-accept screen
 * mostly serves to lose people who close the tab.
 *
 * Signed-out visitors are sent to log in and returned here, because the
 * database refuses an invitation whose email does not match the session.
 */

type Props = { params: Promise<{ token: string }> }

const EXPLANATIONS: Record<string, string> = {
  invalid_invitation:
    'This invitation is not valid, or it has already been used. Ask whoever invited you for a new link.',
  invitation_expired: 'This invitation has expired. Ask for a new one — they last seven days.',
  invitation_email_mismatch:
    'This invitation was sent to a different email address. Sign in with the address it was sent to, then open the link again.',
  not_authenticated: 'Sign in to accept this invitation.',
}

export default async function AcceptInvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`)

  const { data: siteId, error } = await supabase.rpc('accept_site_invitation', { p_token: token })

  if (!error && siteId) redirect(`/dashboard/sites/${siteId}/admin`)

  const reason =
    Object.entries(EXPLANATIONS).find(([code]) => error?.message.includes(code))?.[1] ??
    'That invitation could not be accepted.'

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="max-w-md w-full shadow-sm">
        <CardHeader>
          <CardTitle>Invitation not accepted</CardTitle>
          <CardDescription>{reason}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            You are signed in as <span className="font-medium">{user.email}</span>.
          </p>
          <Link href="/dashboard">
            <Button variant="outline">Go to your dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
