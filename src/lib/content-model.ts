/**
 * The site content model: site -> pages -> sections -> blocks.
 *
 * v1 was a flat `{ sections: [{ id, type, content: any }] }` with five
 * hardcoded portfolio types, a single page, and no schema — the renderer read
 * whatever keys it hoped were there. This replaces it with typed blocks, real
 * pages, and validation at the boundary.
 *
 * Two rules the rest of the codebase depends on:
 *
 * 1. **Nothing user-authored is ever rendered as HTML.** There is deliberately
 *    no raw-HTML block. JSX escapes text, so the remaining injection surface is
 *    URLs, which `sanitizeUrl` restricts to a safe scheme allowlist.
 * 2. **Validation normalises rather than throws.** Generated content (step 4)
 *    and migrated v1 content are both untrusted shapes; a site that renders
 *    with one dropped block beats a page that 500s.
 */

export const CONTENT_MODEL_VERSION = 2 as const

// ---------------------------------------------------------------- primitives

/** Schemes safe to put in an href. Everything else becomes "#". */
const SAFE_LINK_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:']

/**
 * Restrict a user-supplied URL to something safe to render.
 *
 * Blocks `javascript:`, `vbscript:` and `data:` — the last because
 * `data:image/svg+xml` executes script in an <img> in several browsers, so it
 * cannot be waved through just because it looks like an image.
 *
 * Site-relative paths are allowed; protocol-relative (`//evil.com`) is not,
 * because it silently leaves the origin.
 */
export function sanitizeUrl(raw: unknown, fallback = '#'): string {
  if (typeof raw !== 'string') return fallback
  const value = raw.trim()
  if (!value) return fallback
  // Control characters are used to smuggle "java\0script:" past naive checks.
  if (/[\x00-\x1F\x7F]/.test(value)) return fallback
  if (value.startsWith('//')) return fallback
  if (value.startsWith('/') || value.startsWith('#')) return value

  try {
    const parsed = new URL(value)
    return SAFE_LINK_SCHEMES.includes(parsed.protocol) ? parsed.toString() : fallback
  } catch {
    // Not absolute and not rooted: treat as a relative path.
    return /^[\w.\-/]+$/.test(value) ? `/${value.replace(/^\/+/, '')}` : fallback
  }
}

/** Images may only come from http(s) or the site itself — never data:. */
export function sanitizeImageSrc(raw: unknown): string {
  const url = sanitizeUrl(raw, '')
  if (!url || url === '#') return ''
  if (url.startsWith('/')) return url
  return /^https?:/.test(url) ? url : ''
}

const MAX_TEXT = 5000
const MAX_SHORT = 300

function str(value: unknown, max = MAX_SHORT): string {
  if (typeof value !== 'string') return ''
  // Strip control characters but keep newlines/tabs in long-form text.
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, max)
}

function slugify(value: unknown, fallback = 'page'): string {
  const base = str(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || fallback
}

let idCounter = 0
/** Deterministic within a process; ids only need to be unique inside a site. */
function makeId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter.toString(36)}`
}

// -------------------------------------------------------------------- blocks

export type Block =
  | { id: string; type: 'heading'; level: 1 | 2 | 3; text: string }
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'image'; src: string; alt: string }
  | { id: string; type: 'button'; label: string; href: string }
  | { id: string; type: 'list'; ordered: boolean; items: string[] }
  | { id: string; type: 'cards'; items: { title: string; body: string; href: string }[] }
  | { id: string; type: 'stats'; items: { label: string; value: string }[] }
  | { id: string; type: 'quote'; text: string; attribution: string }
  | { id: string; type: 'contact'; email: string; phone: string; note: string }
  | { id: string; type: 'divider' }
  | { id: string; type: 'gallery'; items: { src: string; alt: string; caption: string }[] }

export type BlockType = Block['type']

export const BLOCK_TYPES: BlockType[] = [
  'heading', 'text', 'image', 'gallery', 'button', 'list',
  'cards', 'stats', 'quote', 'contact', 'divider',
]

/** Validate + sanitize one block. Returns null if it cannot be salvaged. */
export function parseBlock(input: unknown): Block | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Record<string, unknown>
  const type = raw.type
  const id = typeof raw.id === 'string' && raw.id ? str(raw.id, 64) : makeId('b')

  switch (type) {
    case 'heading': {
      const text = str(raw.text)
      if (!text) return null
      const lvl = Number(raw.level)
      const level = lvl === 1 || lvl === 2 || lvl === 3 ? (lvl as 1 | 2 | 3) : 2
      return { id, type: 'heading', level, text }
    }
    case 'text': {
      const text = str(raw.text, MAX_TEXT)
      return text ? { id, type: 'text', text } : null
    }
    case 'image': {
      const src = sanitizeImageSrc(raw.src)
      // alt is required for accessibility; an empty string is a valid,
      // meaningful value (decorative), so only the src gates the block.
      return src ? { id, type: 'image', src, alt: str(raw.alt) } : null
    }
    case 'button': {
      const label = str(raw.label, 120)
      return label ? { id, type: 'button', label, href: sanitizeUrl(raw.href) } : null
    }
    case 'list': {
      const items = Array.isArray(raw.items)
        ? raw.items.map((i) => str(i)).filter(Boolean).slice(0, 50)
        : []
      return items.length ? { id, type: 'list', ordered: raw.ordered === true, items } : null
    }
    case 'cards': {
      const items = Array.isArray(raw.items)
        ? raw.items
            .map((i) => {
              const c = (i ?? {}) as Record<string, unknown>
              return {
                title: str(c.title),
                body: str(c.body, 1000),
                href: c.href ? sanitizeUrl(c.href) : '',
              }
            })
            .filter((c) => c.title || c.body)
            .slice(0, 24)
        : []
      return items.length ? { id, type: 'cards', items } : null
    }
    case 'stats': {
      const items = Array.isArray(raw.items)
        ? raw.items
            .map((i) => {
              const s = (i ?? {}) as Record<string, unknown>
              return { label: str(s.label, 80), value: str(s.value, 40) }
            })
            .filter((s) => s.label || s.value)
            .slice(0, 12)
        : []
      return items.length ? { id, type: 'stats', items } : null
    }
    case 'quote': {
      const text = str(raw.text, 1000)
      return text ? { id, type: 'quote', text, attribution: str(raw.attribution) } : null
    }
    case 'contact': {
      const email = str(raw.email, 200)
      const phone = str(raw.phone, 60)
      const note = str(raw.note, 1000)
      return email || phone || note
        ? { id, type: 'contact', email, phone, note }
        : null
    }
    case 'divider':
      return { id, type: 'divider' }
    case 'gallery': {
      const items = Array.isArray(raw.items)
        ? raw.items
            .map((i) => {
              const g = (i ?? {}) as Record<string, unknown>
              const src = sanitizeImageSrc(g.src)
              return src ? { src, alt: str(g.alt), caption: str(g.caption, 200) } : null
            })
            .filter((g): g is { src: string; alt: string; caption: string } => g !== null)
            .slice(0, 50)
        : []
      return { id, type: 'gallery', items }
    }
    default:
      return null
  }
}

// ------------------------------------------------------------------ sections

/** How a section lays its blocks out. Presentation only — never content. */
export type SectionVariant = 'hero' | 'band' | 'grid' | 'split' | 'plain'

export const SECTION_VARIANTS: SectionVariant[] = ['hero', 'band', 'grid', 'split', 'plain']

export interface Section {
  id: string
  variant: SectionVariant
  blocks: Block[]
}

export function parseSection(input: unknown): Section | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Record<string, unknown>
  const variant = SECTION_VARIANTS.includes(raw.variant as SectionVariant)
    ? (raw.variant as SectionVariant)
    : 'plain'
  const blocks = Array.isArray(raw.blocks)
    ? raw.blocks.map(parseBlock).filter((b): b is Block => b !== null).slice(0, 60)
    : []
  if (!blocks.length) return null
  return {
    id: typeof raw.id === 'string' && raw.id ? str(raw.id, 64) : makeId('s'),
    variant,
    blocks,
  }
}

// --------------------------------------------------------------------- pages

export interface Page {
  id: string
  slug: string
  title: string
  description: string
  showInNav: boolean
  sections: Section[]
}

export function parsePage(input: unknown): Page | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Record<string, unknown>
  const sections = Array.isArray(raw.sections)
    ? raw.sections.map(parseSection).filter((s): s is Section => s !== null).slice(0, 40)
    : []
  const title = str(raw.title, 200) || 'Untitled'
  return {
    id: typeof raw.id === 'string' && raw.id ? str(raw.id, 64) : makeId('p'),
    // The home page is the empty slug; everything else is slugified.
    slug: raw.slug === '' ? '' : slugify(raw.slug ?? title),
    title,
    description: str(raw.description, 300),
    showInNav: raw.showInNav !== false,
    sections,
  }
}

// ---------------------------------------------------------------------- site

/**
 * A site type is a *starting composition of blocks*, not a separate template.
 * Nothing downstream branches on it — it only decides what you begin with, and
 * a business site edited into a portfolio is just a site whose blocks changed.
 */
export type SiteType = 'portfolio' | 'business' | 'services' | 'blog' | 'docs' | 'event'

export const SITE_TYPES: SiteType[] = [
  'portfolio', 'business', 'services', 'blog', 'docs', 'event',
]

export interface SiteContent {
  version: typeof CONTENT_MODEL_VERSION
  siteType: SiteType
  theme: string
  pages: Page[]
}

/**
 * Parse and sanitize a whole site.
 *
 * Always returns a renderable site. Slugs are de-duplicated because they map
 * to routes, and a site with two `/about` pages would shadow one silently.
 */
export function parseSiteContent(input: unknown): SiteContent {
  const raw = (input ?? {}) as Record<string, unknown>
  const pages = Array.isArray(raw.pages)
    ? raw.pages.map(parsePage).filter((p): p is Page => p !== null).slice(0, 50)
    : []

  const seen = new Set<string>()
  for (const page of pages) {
    let slug = page.slug
    let n = 2
    while (seen.has(slug)) slug = `${page.slug || 'page'}-${n++}`
    page.slug = slug
    seen.add(slug)
  }
  // Exactly one home page: if nothing claims the empty slug, promote the first.
  if (pages.length && !pages.some((p) => p.slug === '')) {
    seen.delete(pages[0].slug)
    pages[0].slug = ''
  }

  return {
    version: CONTENT_MODEL_VERSION,
    siteType: SITE_TYPES.includes(raw.siteType as SiteType)
      ? (raw.siteType as SiteType)
      : 'portfolio',
    theme: str(raw.theme, 80) || 'minimal',
    pages,
  }
}

// ------------------------------------------------------------------- helpers

export interface NavItem {
  label: string
  href: string
}

/** Navigation derived from the pages themselves — never stored separately. */
export function navFor(site: SiteContent): NavItem[] {
  return site.pages
    .filter((p) => p.showInNav)
    .map((p) => ({ label: p.title, href: p.slug ? `/${p.slug}` : '/' }))
}

export function findPage(site: SiteContent, slug: string): Page | undefined {
  const wanted = slug === '/' ? '' : slug.replace(/^\/+|\/+$/g, '')
  return site.pages.find((p) => p.slug === wanted)
}

/** Relative URLs for every page, for a per-site sitemap.xml. */
export function sitemapPaths(site: SiteContent): string[] {
  return site.pages.map((p) => (p.slug ? `/${p.slug}` : '/'))
}

/**
 * First meaningful text on a page, used as an SEO description when the author
 * has not written one.
 */
export function derivedDescription(page: Page): string {
  if (page.description) return page.description
  for (const section of page.sections) {
    for (const block of section.blocks) {
      if (block.type === 'text') return block.text.slice(0, 155)
    }
  }
  return ''
}
