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

/**
 * A customer's own domain, or null when this host is ours.
 *
 * Whether the domain is actually *connected* is not decided here. Proxy runs
 * on every request and is documented as edge-deployable code that must not
 * rely on shared modules — a database lookup per request would be both slow
 * and wrong-shaped. So any unrecognised host is rewritten optimistically and
 * the `/d/[host]` route resolves it, where a miss is a 404. An unconnected
 * host therefore costs one render, not a certificate.
 */
export function customDomainFromHost(rawHost: string | null): string | null {
  const host = (rawHost ?? '').toLowerCase().split(':')[0]
  if (!host || appHost(host)) return null
  // Anything under our own domain is a subdomain question, never a custom one.
  if (host === ROOT_DOMAIN || host.endsWith(`.${ROOT_DOMAIN}`)) return null
  // Bare IPs pass the hostname regex below; they are never a customer domain.
  if (/^[0-9.]+$/.test(host)) return null
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) return null
  return host
}

/**
 * Paths that stay with the app even on a tenant hostname.
 *
 * Only the public form endpoint. A tenant's contact form has to post
 * somewhere, and posting to its own origin avoids CORS entirely — but the
 * exemption is a single prefix on purpose. Exempting `/api` wholesale would
 * expose every app route on every customer domain.
 */
function appOwnedOnTenantHost(pathname: string): boolean {
  return pathname.startsWith('/api/forms/')
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host')

  if (appOwnedOnTenantHost(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const tenant = tenantFromHost(host)

  if (tenant) {
    const url = request.nextUrl.clone()
    url.pathname = `/s/${tenant}${request.nextUrl.pathname}`
    return tenantResponse(url)
  }

  // A domain the customer owns, serving the same tenant content on its own
  // origin. Same isolation reasoning as subdomains: it is a separate origin,
  // so it gets a separate cookie jar and the app's session is unreachable
  // from stranger-authored HTML.
  const custom = customDomainFromHost(host)
  if (custom) {
    const url = request.nextUrl.clone()
    url.pathname = `/d/${custom}${request.nextUrl.pathname}`
    return tenantResponse(url)
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

/**
 * Rewrite to a tenant route with the headers stranger-authored content needs.
 *
 * Shared by the subdomain and custom-domain paths because the content is
 * identical and only the hostname differs — the isolation guarantees must not
 * quietly diverge between the two.
 */
function tenantResponse(url: URL) {
  const response = NextResponse.rewrite(url)
  // Deny framing and leak-free referrers; the CSP that constrains what the
  // page itself may load is set on the route, where the nonce lives.
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  return response
}

/** Top-level paths owned by the app, which must never 301 to a subdomain. */
const APP_PATHS = new Set([
  'api', 'auth', 'builder', 'dashboard', 'login', 'logout', 'signup',
  'onboarding', 'import', 'pricing', 'preview', 'forgot-password',
  'update-password', 'abuse', 's', 'd', 'invite', 'icon.png', 'robots.txt',
  'sitemap.xml',
])

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
