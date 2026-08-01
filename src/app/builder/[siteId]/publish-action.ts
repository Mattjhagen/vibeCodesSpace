'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { loadSiteContent } from '@/lib/migrate-content'
import { scanSite } from '@/lib/abuse-scan'
import { RELEASE_COOLDOWN_DAYS, subdomainUrl, validateSubdomain } from '@/lib/subdomain'

/** Sites a workspace may create per window — bulk creation is how one signup
 *  becomes a phishing campaign. */
const SITE_CREATION_LIMIT = 5
const SITE_CREATION_WINDOW_HOURS = 24

export type PublishResult =
  | { ok: true; url: string }
  | { ok: false; error: string; reason: string; details?: string[] }

/**
 * Publish a site to `<subdomain>.vibecodes.space`.
 *
 * Gates, in order, cheapest and most-certain first: signed in → email verified
 * → owns the site → name is legal → not creating sites in bulk → content is
 * not a phishing page → name is free. The subdomain claim is last because it
 * is the only step that mutates shared state.
 */
export async function publishSite(
  siteId: string,
  requestedSubdomain: string,
): Promise<PublishResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.', reason: 'unauthenticated' }

  // Email verification before anything is publicly reachable. An unverified
  // address is a free, disposable identity, and publishing is the capability
  // worth attaching a real one to.
  if (!user.email_confirmed_at) {
    return {
      ok: false,
      reason: 'email_unverified',
      error: 'Confirm your email address before publishing a site.',
    }
  }

  const check = validateSubdomain(requestedSubdomain)
  if (!check.ok) {
    return { ok: false, reason: check.reason, error: check.message }
  }

  const { data: site } = await supabase
    .from('sites')
    .select('id, name, theme, content, workspace_id, suspended_at')
    .eq('id', siteId)
    .maybeSingle()
  if (!site) return { ok: false, error: 'Site not found.', reason: 'not_found' }

  if (site.suspended_at) {
    return {
      ok: false,
      reason: 'suspended',
      error: 'This site is suspended and cannot be published. Contact support.',
    }
  }

  // Site-creation rate limit, counted per workspace.
  const windowStart = new Date(
    Date.now() - SITE_CREATION_WINDOW_HOURS * 3_600_000,
  ).toISOString()
  const { count, error: rateError } = await supabase
    .from('site_creation_events')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', site.workspace_id)
    .gte('created_at', windowStart)

  if (rateError) {
    return { ok: false, reason: 'rate_check_failed', error: 'Could not verify your publishing allowance. Try again.' }
  }
  if ((count ?? 0) >= SITE_CREATION_LIMIT) {
    return {
      ok: false,
      reason: 'rate_limited',
      error: `You can publish ${SITE_CREATION_LIMIT} sites per ${SITE_CREATION_WINDOW_HOURS} hours. Contact support if you need more.`,
    }
  }

  const content = loadSiteContent(site.content, { name: site.name, theme: site.theme })
  const scan = scanSite(content)
  if (scan.verdict === 'blocked') {
    return {
      ok: false,
      reason: 'content_blocked',
      error:
        'This site cannot be published because its content matches patterns used for credential phishing. If you believe this is wrong, contact support.',
      details: scan.reasons,
    }
  }

  // Atomic claim. The database decides the winner; a check-then-insert here
  // would race two concurrent publishes for the same name.
  const { error: claimError } = await supabase.rpc('claim_subdomain', {
    p_site_id: siteId,
    p_name: check.value,
  })
  if (claimError) {
    const taken = claimError.message.includes('subdomain_taken')
    return {
      ok: false,
      reason: taken ? 'subdomain_taken' : 'claim_failed',
      error: taken
        ? 'That address is already taken. Try another.'
        : 'Could not reserve that address. Please try again.',
    }
  }

  const { error: publishError } = await supabase
    .from('sites')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('id', siteId)

  if (publishError) {
    // Give the name back rather than stranding it on a site that did not
    // actually publish.
    await supabase.rpc('release_subdomain', {
      p_site_id: siteId,
      p_cooldown_days: 0,
    })
    return { ok: false, reason: 'publish_failed', error: publishError.message }
  }

  await supabase
    .from('site_creation_events')
    .insert({ workspace_id: site.workspace_id })

  // A `review` verdict publishes but is worth a human look — logged rather
  // than blocking a legitimate site on a heuristic.
  if (scan.verdict === 'review') {
    console.warn('[publish] flagged for review', {
      siteId, subdomain: check.value, score: scan.score, reasons: scan.reasons,
    })
  }

  revalidatePath(`/builder/${siteId}`)
  return { ok: true, url: subdomainUrl(check.value) }
}

/** Unpublish, returning the name to the pool after its cooldown. */
export async function unpublishSite(siteId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const { error } = await supabase.rpc('release_subdomain', {
    p_site_id: siteId,
    p_cooldown_days: RELEASE_COOLDOWN_DAYS,
  })
  if (error) return { ok: false, error: error.message }

  await supabase.from('sites').update({ status: 'draft' }).eq('id', siteId)
  revalidatePath(`/builder/${siteId}`)
  return { ok: true }
}
