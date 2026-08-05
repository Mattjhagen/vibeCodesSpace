import { NextRequest } from 'next/server'

// Only allow probing vibecodes.space subdomains — not an open proxy.
const VALID_SUB = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$|^[a-z0-9]{1,63}$/

export async function GET(req: NextRequest) {
  const sub = req.nextUrl.searchParams.get('sub')
  if (!sub || !VALID_SUB.test(sub)) {
    return Response.json({ ok: false, status: 0 }, { status: 400 })
  }

  const url = `https://${sub}.vibecodes.space`
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
      // Don't cache — we need a fresh check every poll
      cache: 'no-store',
    })
    return Response.json({ ok: res.ok, status: res.status })
  } catch {
    return Response.json({ ok: false, status: 0 })
  }
}
