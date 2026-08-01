'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

/**
 * Admin mutations.
 *
 * Every one of these is a thin wrapper over a SECURITY DEFINER function that
 * does its own authorisation. That is deliberate: the checks live next to the
 * data, so a second caller — a future API route, a CLI, a background job —
 * cannot forget them. Nothing here re-implements a permission decision; it only
 * translates a database error into something a person can read.
 */

export type ActionResult = { ok: true } | { ok: false; error: string }

const MESSAGES: Record<string, string> = {
  not_authorized: 'You do not have permission to do that on this site.',
  cannot_grant_above_own_role: 'You cannot give someone a role higher than your own.',
  cannot_remove_stronger_role: 'You cannot remove someone with a higher role than yours.',
  not_authenticated: 'Sign in first.',
  invalid_invitation: 'That invitation is not valid, or has already been used.',
  invitation_expired: 'That invitation has expired. Ask for a new one.',
  invitation_email_mismatch:
    'This invitation was sent to a different email address. Sign in with that address to accept it.',
}

/** Map a raised PL/pgSQL exception onto a sentence. */
function explain(message: string): string {
  for (const [code, text] of Object.entries(MESSAGES)) {
    if (message.includes(code)) return text
  }
  return message
}

export async function setMemberRole(
  siteId: string,
  userId: string,
  role: 'owner' | 'admin' | 'editor' | 'viewer',
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_site_member_role', {
    p_site_id: siteId,
    p_user_id: userId,
    p_role: role,
  })
  if (error) return { ok: false, error: explain(error.message) }
  revalidatePath(`/dashboard/sites/${siteId}/admin`)
  return { ok: true }
}

export async function removeMember(siteId: string, userId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('remove_site_member', {
    p_site_id: siteId,
    p_user_id: userId,
  })
  if (error) return { ok: false, error: explain(error.message) }
  revalidatePath(`/dashboard/sites/${siteId}/admin`)
  return { ok: true }
}

export type InviteResult =
  | { ok: true; token: string; expiresAt: string }
  | { ok: false; error: string }

export async function inviteMember(
  siteId: string,
  email: string,
  role: 'admin' | 'editor' | 'viewer',
): Promise<InviteResult> {
  const supabase = await createClient()

  const address = email.trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }

  const { data, error } = await supabase
    .rpc('invite_site_member', { p_site_id: siteId, p_email: address, p_role: role })
    .maybeSingle<{ out_token: string; out_expires_at: string }>()

  if (error || !data) {
    return { ok: false, error: explain(error?.message ?? 'Could not create that invitation.') }
  }

  revalidatePath(`/dashboard/sites/${siteId}/admin`)
  // The token is returned so the caller can render a link. Sending the email is
  // not wired up — see the session notes; there is no transactional email
  // provider configured in this project yet.
  return { ok: true, token: data.out_token, expiresAt: data.out_expires_at }
}

export async function acceptInvitation(token: string): Promise<ActionResult & { siteId?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('accept_site_invitation', { p_token: token })
  if (error) return { ok: false, error: explain(error.message) }
  return { ok: true, siteId: data as string }
}

export async function markSubmissionRead(
  siteId: string,
  submissionId: string,
  read: boolean,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('form_submissions')
    .update({ read_at: read ? new Date().toISOString() : null })
    .eq('id', submissionId)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/sites/${siteId}/admin`)
  return { ok: true }
}

export async function deleteSubmission(siteId: string, submissionId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('form_submissions').delete().eq('id', submissionId)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/sites/${siteId}/admin`)
  return { ok: true }
}
