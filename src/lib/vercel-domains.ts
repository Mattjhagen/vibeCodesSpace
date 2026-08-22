/**
 * Attaching a connected domain to the hosting project, which is what actually
 * issues its certificate.
 *
 * This is Vercel as the HOST, not as the registrar. The registrar (Porkbun,
 * see ADR-002) is a separate concern and does not affect this file: a domain
 * the customer already owns has to be attached to whatever serves it
 * regardless of where they bought it.
 *
 * Certificates are not requested explicitly. Vercel issues one once the domain
 * is attached to the project and its DNS resolves here, so "issue a
 * certificate" is "attach, then poll until Vercel says verified".
 */

const API = 'https://api.vercel.com'

function projectId(): string {
  return process.env.VERCEL_PROJECT_ID || 'vibe-codes-space'
}

/** Team-scoped tokens need the team id as a query param on every call. */
function scope(): string {
  const team = process.env.VERCEL_TEAM_ID
  return team ? `?teamId=${encodeURIComponent(team)}` : ''
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

export type AttachResult =
  | { ok: true; alreadyAttached: boolean }
  | { ok: false; reason: 'not_configured' | 'conflict' | 'api_error' | 'network'; detail: string }

/**
 * Attach a hostname to the project.
 *
 * A 409 means it is attached somewhere already. That is two very different
 * situations — attached to *this* project (fine, and the common case on a
 * re-check) or attached to another account's project (not fine, and not
 * something we can resolve for them) — so it is reported distinctly rather
 * than folded into a generic failure.
 */
export async function attachDomainToProject(host: string): Promise<AttachResult> {
  if (!process.env.VERCEL_TOKEN) {
    return {
      ok: false,
      reason: 'not_configured',
      detail: 'VERCEL_TOKEN is not set, so no certificate can be issued for this domain.',
    }
  }

  let res: Response
  try {
    res = await fetch(`${API}/v10/projects/${projectId()}/domains${scope()}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: host }),
    })
  } catch (err) {
    return {
      ok: false,
      reason: 'network',
      detail: err instanceof Error ? err.message : String(err),
    }
  }

  if (res.ok) return { ok: true, alreadyAttached: false }

  const body = await res.text()

  if (res.status === 409) {
    // Already on this project: idempotent success, which matters because
    // "check again" re-runs this on every poll.
    const mine = await isAttachedToProject(host)
    if (mine === true) return { ok: true, alreadyAttached: true }
    return {
      ok: false,
      reason: 'conflict',
      detail: `${host} is already assigned to a different project or account. It must be removed there before it can be connected here.`,
    }
  }

  return { ok: false, reason: 'api_error', detail: `${res.status} ${body}` }
}

/** `null` when the answer could not be determined, which is not the same as `false`. */
export async function isAttachedToProject(host: string): Promise<boolean | null> {
  if (!process.env.VERCEL_TOKEN) return null
  try {
    const res = await fetch(
      `${API}/v9/projects/${projectId()}/domains/${encodeURIComponent(host)}${scope()}`,
      { headers: authHeaders() },
    )
    if (res.ok) return true
    if (res.status === 404) return false
    return null
  } catch {
    return null
  }
}

export type CertificateState = 'issuing' | 'issued' | 'failed'

/**
 * Where the certificate has got to.
 *
 * Vercel's project-domain record carries `verified`, which flips once it has
 * confirmed the domain resolves here and the certificate is in place. Anything
 * we cannot read is reported as still issuing rather than failed: a transient
 * API error is not evidence that issuance broke, and showing a customer
 * "certificate failed" when it is merely slow sends them to change DNS that
 * was already correct.
 */
export async function certificateState(
  host: string,
): Promise<{ state: CertificateState; detail: string }> {
  if (!process.env.VERCEL_TOKEN) {
    return { state: 'failed', detail: 'VERCEL_TOKEN is not set.' }
  }
  try {
    const res = await fetch(
      `${API}/v9/projects/${projectId()}/domains/${encodeURIComponent(host)}${scope()}`,
      { headers: authHeaders() },
    )
    if (res.status === 404) {
      return { state: 'failed', detail: 'The domain is not attached to the project.' }
    }
    if (!res.ok) {
      return { state: 'issuing', detail: `Could not read certificate status (${res.status}).` }
    }
    const data = (await res.json()) as { verified?: boolean }
    return data.verified
      ? { state: 'issued', detail: 'Certificate issued. The domain is serving over HTTPS.' }
      : {
          state: 'issuing',
          detail: 'DNS is correct; the certificate is being issued. This usually takes a few minutes.',
        }
  } catch (err) {
    return {
      state: 'issuing',
      detail: `Could not read certificate status: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}
