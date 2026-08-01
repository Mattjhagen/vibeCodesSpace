import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { RESERVED_NAMES } from '@/lib/subdomain'

/**
 * Host-based routing for published sites.
 *
 * `alice.vibecodes.space/about` rewrites to `/s/alice/about`, which renders
 * that tenant's content. The rewrite is invisible to the browser, so the origin
 * the page runs under stays `alice.vibecodes.space` — which is the whole point:
 * cookies, localStorage and service-worker scope are partitioned by origin, and
 * a path-based scheme would put every tenant *and* the logged-in app session in
 * one jar.
 *
 * `vibecodes.space/alice` therefore exists only as a 301 to the subdomain,
 * never as a place user content is served.
 *
 * Tenant requests deliberately skip `updateSession`. Refreshing a vibeCodes
 * auth cookie on a tenant origin would be both useless and wrong — the app's
 * session must not be reachable from a page whose HTML a stranger authored.
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'vibecodes.space'

/** Hostnames that serve the app itself rather than a tenant. */
function appHost(host: string): boolean {
  return (
    host === ROOT_DOMAIN ||
    host === `www.${ROOT_DOMAIN}` ||
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    // Platform preview deploys.
    host.endsWith('.vercel.app')
  )
}

/**
 * The tenant label, or null when this host is the app.
 *
 * Multi-level hosts (`a.b.vibecodes.space`) return null on purpose: the
 * wildcard certificate covers exactly one level, so a deeper name would be
 * served without a valid cert and must not resolve to a tenant.
 */
export function tenantFromHost(rawHost: string | null): string | null {
  const host = (rawHost ?? '').toLowerCase().split(':')[0]
  if (!host || appHost(host)) return null
  if (!host.endsWith(`.${ROOT_DOMAIN}`)) return null

  const label = host.slice(0, -(ROOT_DOMAIN.length + 1))
  if (!label || label.includes('.')) return null
  if (RESERVED_NAMES.has(label)) return null
  return label
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host')
  const tenant = tenantFromHost(host)

  if (tenant) {
    const url = request.nextUrl.clone()
    url.pathname = `/s/${tenant}${request.nextUrl.pathname}`
    const response = NextResponse.rewrite(url)
    // Tenant pages are stranger-authored content on their own origin. Deny
    // framing and leak-free referrers; the CSP that constrains what the page
    // itself may load is set on the route, where the nonce lives.
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'no-referrer')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    return response
  }

  // Apex path that looks like a tenant name: 301 to the subdomain rather than
  // serving anything from the app's own origin.
  const first = request.nextUrl.pathname.split('/')[1]
  if (
    first &&
    /^[a-z0-9-]{3,63}$/.test(first) &&
    !RESERVED_NAMES.has(first) &&
    !APP_PATHS.has(first)
  ) {
    return NextResponse.redirect(
      new URL(
        `https://${first}.${ROOT_DOMAIN}${request.nextUrl.pathname.replace(`/${first}`, '') || '/'}`,
      ),
      301,
    )
  }

  return await updateSession(request)
}

/** Top-level paths owned by the app, which must never 301 to a subdomain. */
const APP_PATHS = new Set([
  'api', 'auth', 'builder', 'dashboard', 'login', 'logout', 'signup',
  'onboarding', 'import', 'pricing', 'preview', 'forgot-password',
  'update-password', 'abuse', 's', 'icon.png', 'robots.txt', 'sitemap.xml',
])

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
