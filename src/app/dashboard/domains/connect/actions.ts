'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import {
  dnsInstructions,
  normalizeCustomDomain,
  verifyDomain,
  type VerifyReason,
} from '@/lib/custom-domain'
import { attachDomainToProject, certificateState } from '@/lib/vercel-domains'

/**
 * Connecting a domain, end to end.
 *
 * The DNS logic lives in `src/lib/custom-domain.ts` and is deliberately pure —
 * it takes a host and a token and asks public DNS. This file is what gives it
 * a caller: it decides who is allowed to claim a host, where the answers are
 * recorded, and what happens once both checks pass.
 *
 * The ordering that matters: the server runs the lookups ITSELF and then
 * writes the result with the service role. The client never reports a
 * verification outcome, because `ownership_verified_at` is what authorises
 * certificate issuance for a hostname.
 */

export type ConnectResult =
  | {
      ok: true
      host: string
      isApex: boolean
      instructions: ReturnType<typeof dnsInstructions>
    }
  | { ok: false; reason: string; error: string }

export type CheckResult =
  | {
      ok: true
      host: string
      connected: boolean
      ownership: { verified: boolean; reason: VerifyReason; detail: string }
      pointing: { verified: boolean; reason: VerifyReason; detail: string }
      certificate: { status: string; detail: string }
    }
  | { ok: false; reason: string; error: string }

/** Claim a host for a site and return the records the owner has to publish. */
export async function connectDomain(
  siteId: string,
  rawDomain: string,
): Promise<ConnectResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: 'unauthenticated', error: 'Not signed in.' }

  // Same gate as publishing: an unverified address is a free, disposable
  // identity, and attaching a hostname to our certificate infrastructure is
  // not a capability to hand to one.
  if (!user.email_confirmed_at) {
    return {
      ok: false,
      reason: 'email_unverified',
      error: 'Confirm your email address before connecting a domain.',
    }
  }

  const check = normalizeCustomDomain(rawDomain)
  if (!check.ok) return { ok: false, reason: check.reason, error: check.message }

  // Ownership of the SITE. Ownership of the DOMAIN is what the TXT record
  // proves, and is checked separately in checkDomain().
  const { data: site } = await supabase
    .from('sites')
    .select('id, suspended_at')
    .eq('id', siteId)
    .maybeSingle()
  if (!site) return { ok: false, reason: 'not_found', error: 'Site not found.' }
  if (site.suspended_at) {
    return {
      ok: false,
      reason: 'suspended',
      error: 'This site is suspended. Contact support before connecting a domain.',
    }
  }

  const { data: claim, error: claimError } = await supabase
    .rpc('claim_custom_domain', {
      p_site_id: siteId,
      p_host: check.host,
      p_is_apex: check.isApex,
    })
    .maybeSingle<{ out_host: string; out_token: string }>()

  if (claimError || !claim) {
    const taken = claimError?.message.includes('domain_taken')
    return {
      ok: false,
      reason: taken ? 'domain_taken' : 'claim_failed',
      error: taken
        ? `${check.host} is already being connected by another account. If it is yours, it becomes claimable again once their unverified claim expires.`
        : (claimError?.message ?? 'Could not claim that domain. Try again.'),
    }
  }

  revalidatePath('/dashboard/domains/connect')
  return {
    ok: true,
    host: claim.out_host,
    isApex: check.isApex,
    instructions: dnsInstructions(claim.out_host, check.isApex, claim.out_token),
  }
}

/**
 * Re-check a claimed domain against live DNS and record the outcome.
 *
 * Called by the owner pressing "check again", so it does real lookups every
 * time rather than trusting the stored status — the stored status is a cache
 * for rendering, never the thing a decision is made on.
 */
export async function checkDomain(host: string): Promise<CheckResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: 'unauthenticated', error: 'Not signed in.' }

  // Read through the user's own client, so RLS decides whether this row is
  // theirs. The service client below can see every row and must never be the
  // thing that answers "is this yours".
  const { data: domain } = await supabase
    .from('custom_domains')
    .select('host, site_id, is_apex, verification_token')
    .eq('host', host.toLowerCase())
    .maybeSingle()

  if (!domain) {
    return { ok: false, reason: 'not_found', error: 'That domain is not connected to any of your sites.' }
  }

  const status = await verifyDomain(domain.host, domain.is_apex, domain.verification_token)

  // Certificate issuance is attempted only once BOTH checks pass. Ownership
  // alone is not enough (the domain would serve nothing) and pointing alone is
  // the dangerous one — a dangling record someone else abandoned points here
  // too, and issuing on that basis hands over their hostname.
  let certificate: { status: string; detail: string } = {
    status: 'pending',
    detail: 'Waiting for both DNS checks to pass.',
  }

  if (status.readyForCertificate) {
    const attach = await attachDomainToProject(domain.host)
    if (attach.ok) {
      certificate = await certificateState(domain.host).then((c) => ({
        status: c.state,
        detail: c.detail,
      }))
    } else {
      certificate = { status: 'failed', detail: attach.detail }
    }
  }

  const now = new Date().toISOString()
  const service = createServiceClient()

  const { error: writeError } = await service
    .from('custom_domains')
    .update({
      ownership_verified_at: status.ownership.verified ? now : null,
      pointing_verified_at: status.pointing.verified ? now : null,
      certificate_status: certificate.status,
      certificate_detail: certificate.detail,
      last_checked_at: now,
      // The failing half is the actionable one; once both pass, 'ok'.
      last_reason: status.ownership.verified ? status.pointing.reason : status.ownership.reason,
      last_detail: status.ownership.verified ? status.pointing.detail : status.ownership.detail,
    })
    .eq('host', domain.host)

  if (writeError) {
    return { ok: false, reason: 'write_failed', error: writeError.message }
  }

  // Mirror onto the site only when it is actually serving, so a half-connected
  // domain never shows up as the site's address.
  if (status.readyForCertificate) {
    await service.from('sites').update({ custom_domain: domain.host }).eq('id', domain.site_id)
  } else {
    await service
      .from('sites')
      .update({ custom_domain: null })
      .eq('id', domain.site_id)
      .eq('custom_domain', domain.host)
  }

  revalidatePath('/dashboard/domains/connect')
  return {
    ok: true,
    host: domain.host,
    connected: status.readyForCertificate,
    ownership: {
      verified: status.ownership.verified,
      reason: status.ownership.reason,
      detail: status.ownership.detail,
    },
    pointing: {
      verified: status.pointing.verified,
      reason: status.pointing.reason,
      detail: status.pointing.detail,
    },
    certificate,
  }
}

/** Give up a claim. */
export async function disconnectDomain(host: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const { error } = await supabase.rpc('release_custom_domain', { p_host: host.toLowerCase() })
  if (error) {
    return {
      ok: false,
      error: error.message.includes('not_authorized')
        ? 'That domain is not connected to any of your sites.'
        : error.message,
    }
  }

  // The row is gone from our side, but the domain is still attached to the
  // hosting project. Left deliberately: detaching is not reversible from here
  // if the customer is mid-migration, and a stale attachment serves nothing
  // once the DNS moves. Worth a reconciliation job later.
  revalidatePath('/dashboard/domains/connect')
  return { ok: true }
}
