/*
 * Content-model verification. Run from the repo root:
 *
 *   npx tsx --tsconfig tsconfig.verify.json scripts/verify-content-model.tsx
 *
 * Uses npx rather than a devDependency so the repo stays at its current
 * dependency count. Exits non-zero if the migration loses authored text or if
 * hostile input survives sanitization.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { startingContent } from '../src/lib/site-types'
import { PageView } from '../src/components/site-engine/render'
import {
  migrateV1ToV2,
  migrationPreservesText,
  loadSiteContent,
  V1Content,
} from '../src/lib/migrate-content'
import { parseSiteContent, sanitizeUrl, sanitizeImageSrc } from '../src/lib/content-model'

const line = (t: string) => console.log('\n' + '='.repeat(70) + '\n' + t + '\n' + '='.repeat(70))

// ---------------------------------------------------------------- 1. non-portfolio site
line('1. NON-PORTFOLIO SITE ("business") — STORED CONTENT MODEL')
const business = startingContent('business', 'Northwind Plumbing', 'minimal')
console.log(JSON.stringify(business, null, 2))

line('1b. SAME SITE — RENDERED HTML (home page)')
const home = business.pages[0]
console.log(renderToStaticMarkup(PageView({ site: business, page: home }) as never))

line('1c. PAGE / ROUTE MAP (multi-page + nav)')
for (const p of business.pages) {
  console.log(`  ${(p.slug ? '/' + p.slug : '/').padEnd(12)} "${p.title}"  nav=${p.showInNav}  sections=${p.sections.length}`)
}

// ---------------------------------------------------------------- 2. all site types
line('2. EVERY SITE TYPE IS A COMPOSITION (pages / sections / blocks)')
for (const t of ['portfolio', 'business', 'services', 'blog', 'docs', 'event'] as const) {
  const s = startingContent(t, 'Example')
  const sections = s.pages.reduce((n, p) => n + p.sections.length, 0)
  const blocks = s.pages.reduce((n, p) => n + p.sections.reduce((m, x) => m + x.blocks.length, 0), 0)
  const kinds = new Set(s.pages.flatMap(p => p.sections.flatMap(x => x.blocks.map(b => b.type))))
  console.log(`  ${t.padEnd(10)} pages=${s.pages.length} sections=${sections} blocks=${blocks}  types: ${[...kinds].join(', ')}`)
}

// ---------------------------------------------------------------- 3. migration round-trip
line('3. MIGRATION — v1 PORTFOLIO ROUND-TRIP')
const v1: V1Content = {
  sections: [
    { id: 'hero-1', type: 'hero', content: { title: 'Ada Lovelace', subtitle: 'Mathematician and first programmer.', cta: 'Get in Touch' } },
    { id: 'about-1', type: 'about', content: { title: 'About Me', text: 'I work on analytical engines and the notes that make them useful.' } },
    { id: 'exp-1', type: 'experience', content: { title: 'Experience', jobs: [
      { role: 'Analyst', company: 'Analytical Engine Co', years: '1842-1843', desc: 'Wrote the first published algorithm.' },
      { role: 'Correspondent', company: 'Royal Society', years: '1840', desc: 'Translated and annotated Menabrea.' },
    ] } },
    { id: 'skills-1', type: 'skills', content: { title: 'Key Expertise', items: ['Algorithms', 'Mathematics', 'Technical writing'] } },
    { id: 'contact-1', type: 'contact', content: { title: "Let's Connect", email: 'ada@example.com', description: 'Open to correspondence.' } },
  ],
}
const migrated = migrateV1ToV2(v1, { name: 'Ada Lovelace' })
const missing = migrationPreservesText(v1, migrated)
console.log('v1 sections:', v1.sections!.length, '-> v2 sections:', migrated.pages[0].sections.length)
console.log('v1 strings not present in v2:', missing.length === 0 ? 'NONE — content preserved' : missing)
if (missing.length) { console.error('ROUND-TRIP FAILED'); process.exit(1) }

console.log('\nmigrated blocks:')
for (const s of migrated.pages[0].sections) {
  console.log(`  [${s.variant}] ${s.blocks.map(b => b.type).join(', ')}`)
}

line('3b. MIGRATION IS IDEMPOTENT (loading a migrated site again is a no-op)')
const once = loadSiteContent(v1, { name: 'Ada Lovelace' })
const twice = loadSiteContent(JSON.parse(JSON.stringify(once)))
const stable = JSON.stringify(once) === JSON.stringify(twice)
console.log('re-loading migrated content is stable:', stable)
if (!stable) { console.error('NOT IDEMPOTENT'); process.exit(1) }

// ---------------------------------------------------------------- 4. sanitization
line('4. SANITIZATION — HOSTILE INPUT')
const attacks = [
  'javascript:alert(1)',
  'JaVaScRiPt:alert(1)',
  'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  'vbscript:msgbox(1)',
  '//evil.example.com/x',
  'https://ok.example.com/fine',
  '/relative/path',
]
for (const a of attacks) console.log(`  href  ${a.padEnd(58)} -> ${sanitizeUrl(a)}`)
for (const a of ['data:image/svg+xml,<svg onload=alert(1)>', 'https://cdn.example.com/a.png'])
  console.log(`  img   ${a.padEnd(58)} -> ${sanitizeImageSrc(a) || '(rejected)'}`)

line('4b. SCRIPT IN AUTHORED TEXT IS ESCAPED, NOT EXECUTED')
const hostile = parseSiteContent({
  version: 2, siteType: 'business', theme: 'minimal',
  pages: [{ slug: '', title: 'X', sections: [{ variant: 'plain', blocks: [
    { type: 'heading', level: 1, text: '<script>alert("xss")</script>' },
    { type: 'text', text: '<img src=x onerror=alert(1)>' },
    { type: 'button', label: 'Click', href: 'javascript:alert(1)' },
  ] }] }],
})
const html = renderToStaticMarkup(PageView({ site: hostile, page: hostile.pages[0] }) as never)
console.log(html)
/*
 * Substring-matching "onerror=" is wrong: it appears harmlessly *inside*
 * escaped text. What matters is whether the payload survives as markup, so
 * each check asserts the escaped form is present and the raw form is not.
 */
const checks: [string, boolean][] = [
  ['<script> rendered as a tag', html.includes('<script')],
  ['script payload escaped', !html.includes('&lt;script&gt;')],
  ['<img> rendered as a tag', /<img[^>]*onerror/i.test(html)],
  ['img payload escaped', !html.includes('&lt;img src=x onerror=alert(1)&gt;')],
  ['javascript: survived in an attribute', /(?:href|src)="javascript:/i.test(html)],
  ['event handler in attribute position', /\s on[a-z]+="/i.test(html)],
]
let bad = false
for (const [label, failed] of checks) {
  console.log(`  ${failed ? 'FAIL' : 'ok  '}  ${label}`)
  if (failed) bad = true
}
if (bad) { console.error('SANITIZATION FAILED'); process.exit(1) }

line('ALL STEP 2 CHECKS PASSED')
