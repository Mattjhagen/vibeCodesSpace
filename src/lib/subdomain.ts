/**
 * Subdomain validation and allocation rules.
 *
 * A subdomain is not just a label — it is an ORIGIN. `alice.vibecodes.space`
 * gets its own cookie jar, localStorage, and service-worker scope, enforced by
 * the browser. That is the entire reason published sites live on subdomains
 * rather than paths: `vibecodes.space/alice` would share all three with the
 * logged-in app session and with every other tenant.
 *
 * It also means handing out the wrong label is not cosmetic. `www` or `api`
 * shadows infrastructure; `paypal` hands an attacker a plausible-looking
 * hostname under a domain that will carry a valid TLS certificate.
 */

/** DNS label limit; 3 is a product floor, not a protocol one. */
export const MIN_LENGTH = 3
export const MAX_LENGTH = 63

/**
 * Names that shadow infrastructure, protocol conventions, or the app itself.
 *
 * Mail entries matter more than they look: a site at `mail.` or `mx.` sitting
 * on a hostname that also publishes SPF/DKIM undermines the domain's email
 * reputation, and `autodiscover`/`autoconfig` are fetched automatically by
 * mail clients.
 */
export const RESERVED_NAMES = new Set([
  // app + web
  'www', 'app', 'apps', 'admin', 'administrator', 'root', 'sudo',
  'api', 'apis', 'graphql', 'rpc', 'ws', 'websocket',
  'login', 'logout', 'signin', 'signup', 'register', 'auth', 'oauth', 'sso',
  'account', 'accounts', 'profile', 'settings', 'dashboard', 'console',
  'billing', 'pay', 'payment', 'payments', 'checkout', 'invoice', 'invoices',
  'secure', 'security', 'verify', 'verification', 'password', 'reset',
  // support + status
  'support', 'help', 'helpdesk', 'contact', 'status', 'health', 'uptime',
  'abuse', 'legal', 'privacy', 'terms', 'dmca', 'security-txt',
  // infra
  'cdn', 'static', 'assets', 'media', 'img', 'images', 'files', 'download',
  'downloads', 'upload', 'uploads', 'storage', 'backup', 'backups',
  'ns', 'ns1', 'ns2', 'ns3', 'ns4', 'dns', 'mx', 'mx1', 'mx2',
  'mail', 'email', 'smtp', 'imap', 'pop', 'pop3', 'webmail', 'mailer',
  'autodiscover', 'autoconfig', 'spf', 'dkim', 'dmarc',
  'ftp', 'sftp', 'ssh', 'vpn', 'proxy', 'gateway', 'router', 'edge',
  // environments
  'dev', 'development', 'staging', 'stage', 'test', 'testing', 'qa', 'uat',
  'preview', 'demo', 'sandbox', 'local', 'localhost', 'internal', 'private',
  'prod', 'production', 'beta', 'alpha', 'canary',
  // content
  'blog', 'docs', 'doc', 'documentation', 'wiki', 'news', 'press', 'about',
  'shop', 'store', 'careers', 'jobs', 'team', 'partners', 'community',
  // product
  'vibecodes', 'vibe', 'codes', 'builder', 'editor', 'studio', 'publish',
])

/**
 * Brands an attacker would want in a hostname.
 *
 * This is a phishing control, not a trademark policy. A page at
 * `paypal.vibecodes.space` arrives with a valid certificate and a padlock, and
 * the part of the hostname a hurried person reads is the part on the left.
 *
 * Matching is substring-based, so `paypal-login` and `secure-paypal` are caught
 * too. That over-blocks a legitimate `apple-orchard`, which is the right
 * trade: a false rejection costs someone one rename, a false accept costs a
 * real person their credentials.
 */
export const BRAND_FRAGMENTS = [
  'paypal', 'apple', 'icloud', 'google', 'gmail', 'youtube', 'microsoft',
  'outlook', 'office365', 'windows', 'amazon', 'aws', 'netflix', 'spotify',
  'facebook', 'instagram', 'whatsapp', 'meta', 'twitter', 'linkedin', 'tiktok',
  'stripe', 'coinbase', 'binance', 'blockchain', 'metamask', 'ledger',
  'chase', 'wellsfargo', 'citibank', 'hsbc', 'barclays', 'natwest', 'santander',
  'revolut', 'monzo', 'venmo', 'cashapp', 'zelle', 'wise', 'westernunion',
  'visa', 'mastercard', 'amex', 'americanexpress',
  'dhl', 'fedex', 'ups', 'usps', 'royalmail',
  'irs', 'hmrc', 'gov', 'nhs', 'medicare',
  'steam', 'discord', 'roblox', 'epicgames', 'battlenet',
  'dropbox', 'onedrive', 'docusign', 'okta', 'auth0', 'cloudflare', 'github',
]

export type SubdomainRejection =
  | 'too_short' | 'too_long' | 'invalid_characters' | 'leading_hyphen'
  | 'trailing_hyphen' | 'punycode_lookalike' | 'all_numeric'
  | 'reserved' | 'brand'

export type SubdomainCheck =
  | { ok: true; value: string }
  | { ok: false; reason: SubdomainRejection; message: string }

/**
 * Validate a requested subdomain.
 *
 * Deliberately does NOT check availability — that has to happen atomically in
 * the database, because a check-then-insert has a race between the two.
 */
export function validateSubdomain(raw: string): SubdomainCheck {
  const value = (raw ?? '').trim().toLowerCase()

  if (value.length < MIN_LENGTH) {
    return { ok: false, reason: 'too_short', message: `Must be at least ${MIN_LENGTH} characters.` }
  }
  if (value.length > MAX_LENGTH) {
    return { ok: false, reason: 'too_long', message: `Must be ${MAX_LENGTH} characters or fewer.` }
  }
  if (!/^[a-z0-9-]+$/.test(value)) {
    return {
      ok: false, reason: 'invalid_characters',
      message: 'Use only lowercase letters, numbers and hyphens.',
    }
  }
  if (value.startsWith('-')) {
    return { ok: false, reason: 'leading_hyphen', message: 'Cannot start with a hyphen.' }
  }
  if (value.endsWith('-')) {
    return { ok: false, reason: 'trailing_hyphen', message: 'Cannot end with a hyphen.' }
  }
  // Positions 3-4 being "--" is the IDNA A-label marker (xn--). Anything in
  // that shape either is punycode or is shaped to be mistaken for it.
  if (value.length >= 4 && value[2] === '-' && value[3] === '-') {
    return {
      ok: false, reason: 'punycode_lookalike',
      message: 'Cannot have two hyphens in the third and fourth positions.',
    }
  }
  // An all-numeric label invites confusion with an IP address in logs and
  // URL parsers.
  if (/^[0-9]+$/.test(value)) {
    return { ok: false, reason: 'all_numeric', message: 'Cannot be only numbers.' }
  }
  if (RESERVED_NAMES.has(value)) {
    return { ok: false, reason: 'reserved', message: 'That name is reserved.' }
  }
  const brand = BRAND_FRAGMENTS.find((b) => value.includes(b))
  if (brand) {
    return {
      ok: false, reason: 'brand',
      message: 'That name is not available. Names resembling well-known brands cannot be used.',
    }
  }

  return { ok: true, value }
}

/**
 * How long a released subdomain stays unavailable.
 *
 * Prevents subdomain takeover: links, QR codes and search results outlive the
 * site, so instant re-claim would let a stranger inherit an audience that
 * still trusts the name.
 */
export const RELEASE_COOLDOWN_DAYS = 30

export function subdomainUrl(subdomain: string): string {
  return `https://${subdomain}.vibecodes.space`
}
