import { NextRequest } from 'next/server'

// Only allow probing vibecodes.space subdomains — not an open proxy.
const VALID_SUB = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$|^[a-z0-9]{1,63}$/

/**
 * stage meanings:
 *  'dns'     — domain doesn't resolve yet (ENOTFOUND / ESERVFAIL)
 *  'ssl'     — DNS resolves but TLS/connection not ready (ECONNRESET etc.)
 *  'live'    — got an HTTP response (site is up)
 *  'unknown' — some other transient error
 */
export type ProbeStage = 'dns' | 'ssl' | 'live' | 'unknown'

export async function GET(req: NextRequest) {
  const sub = req.nextUrl.searchParams.get('sub')
  if (!sub || !VALID_SUB.test(sub)) {
    return Response.json({ ok: false, stage: 'unknown', status: 0 }, { status: 400 })
  }

  const url = `https://${sub}.vibecodes.space`
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    })
    // DNS and TLS may be working while the tenant still returns a 404. Only a
    // successful response means the newly published site is actually live.
    return Response.json({
      ok: res.ok,
      stage: res.ok ? 'live' as ProbeStage : 'unknown' as ProbeStage,
      status: res.status,
    })
  } catch (err) {
    const msg = String(err)
    // ENOTFOUND / ESERVFAIL = DNS hasn't propagated yet
    if (/ENOTFOUND|ESERVFAIL|EAI_AGAIN/i.test(msg)) {
      return Response.json({ ok: false, stage: 'dns' as ProbeStage, status: 0 })
    }
    // ECONNRESET / ECONNREFUSED / ERR_CONNECTION_CLOSED / cert errors
    // = DNS resolves but SSL or server not ready yet
    if (/ECONNRESET|ECONNREFUSED|ERR_CONNECTION|SSL|certificate|TLS/i.test(msg)) {
      return Response.json({ ok: false, stage: 'ssl' as ProbeStage, status: 0 })
    }
    return Response.json({ ok: false, stage: 'unknown' as ProbeStage, status: 0 })
  }
}
