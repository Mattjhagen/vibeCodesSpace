/**
 * Credential-harvesting scan, run before a site is allowed to publish.
 *
 * The content model does most of the work here: there is no raw-HTML block and
 * no form block, so a tenant cannot author a password input at all — the
 * classic "password field posting cross-origin" pattern is structurally
 * impossible rather than merely detected. What remains is social: text that
 * impersonates a brand, and buttons pointing off-site to somewhere that *does*
 * have a password field.
 *
 * So this scores two things — impersonation language and off-site
 * destinations — and treats the combination as far worse than either alone. A
 * roofing company linking to its Facebook page is fine; a page that says
 * "verify your PayPal account" and links off-site is not.
 *
 * Deliberately advisory-plus-blocking rather than purely blocking: `review`
 * lets a human look without holding up every legitimate site.
 */

import type { SiteContent } from './content-model'
import { BRAND_FRAGMENTS } from './subdomain'

/** Verbs and nouns that only co-occur with brands on a credential page. */
const CREDENTIAL_TERMS = [
  'password', 'passcode', 'pin number', 'security code', 'one-time code',
  'sign in to your', 'log in to your', 'login to your',
  'verify your account', 'confirm your account', 'validate your account',
  'account has been suspended', 'account will be closed', 'unusual activity',
  'confirm your identity', 'verify your identity',
  'card number', 'cvv', 'security number', 'sort code', 'routing number',
  'social security', 'seed phrase', 'recovery phrase', 'private key',
  'wallet address', 'two-factor', '2fa code', 'authentication code',
]

const URGENCY_TERMS = [
  'within 24 hours', 'immediately or', 'will be permanently', 'act now',
  'failure to do so', 'your account will be',
]

export type ScanVerdict = 'clean' | 'review' | 'blocked'

export interface ScanResult {
  verdict: ScanVerdict
  score: number
  reasons: string[]
  externalHosts: string[]
}

const ROOT_DOMAIN = 'vibecodes.space'

function allText(site: SiteContent): string {
  const parts: string[] = []
  for (const page of site.pages) {
    parts.push(page.title, page.description)
    for (const section of page.sections) {
      for (const b of section.blocks) {
        switch (b.type) {
          case 'heading': case 'text': parts.push(b.text); break
          case 'button': parts.push(b.label); break
          case 'list': parts.push(...b.items); break
          case 'cards': for (const c of b.items) parts.push(c.title, c.body); break
          case 'stats': for (const s of b.items) parts.push(s.label, s.value); break
          case 'quote': parts.push(b.text, b.attribution); break
          case 'contact': parts.push(b.note); break
        }
      }
    }
  }
  return parts.join(' \n ').toLowerCase()
}

function externalLinkHosts(site: SiteContent): string[] {
  const hosts = new Set<string>()
  const consider = (href: string) => {
    if (!href || href.startsWith('/') || href === '#') return
    try {
      const url = new URL(href)
      if (!/^https?:$/.test(url.protocol)) return
      const host = url.hostname.toLowerCase()
      if (host === ROOT_DOMAIN || host.endsWith(`.${ROOT_DOMAIN}`)) return
      hosts.add(host)
    } catch {
      /* sanitizeUrl already neutralised anything unparseable */
    }
  }
  for (const page of site.pages) {
    for (const section of page.sections) {
      for (const b of section.blocks) {
        if (b.type === 'button') consider(b.href)
        if (b.type === 'cards') for (const c of b.items) consider(c.href)
      }
    }
  }
  return [...hosts]
}

export function scanSite(site: SiteContent): ScanResult {
  const text = allText(site)
  const externalHosts = externalLinkHosts(site)
  const reasons: string[] = []
  let score = 0

  const brands = BRAND_FRAGMENTS.filter((b) => text.includes(b))
  const credentials = CREDENTIAL_TERMS.filter((t) => text.includes(t))
  const urgency = URGENCY_TERMS.filter((t) => text.includes(t))

  if (brands.length) {
    score += 2
    reasons.push(`References well-known brands: ${brands.slice(0, 5).join(', ')}`)
  }
  if (credentials.length) {
    score += 3
    reasons.push(`Asks for credentials or account details: ${credentials.slice(0, 5).join(', ')}`)
  }
  if (urgency.length) {
    score += 1
    reasons.push('Uses account-threat urgency language')
  }
  if (externalHosts.length) {
    score += 1
    reasons.push(`Links off-site to: ${externalHosts.slice(0, 5).join(', ')}`)
  }

  // The combination is the signal. Brand impersonation plus a credential ask
  // is the shape of every phishing page; either alone is ordinary copy.
  if (brands.length && credentials.length) {
    score += 4
    reasons.push('Combines brand impersonation with a credential request')
  }
  if (brands.length && credentials.length && externalHosts.length) {
    score += 3
    reasons.push('Sends visitors off-site after a branded credential request')
  }

  const verdict: ScanVerdict = score >= 7 ? 'blocked' : score >= 4 ? 'review' : 'clean'
  return { verdict, score, reasons, externalHosts }
}
