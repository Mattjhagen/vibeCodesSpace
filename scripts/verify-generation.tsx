/*
 * Generation verification. Run from the repo root:
 *
 *   npx tsx --tsconfig tsconfig.verify.json scripts/verify-generation.tsx
 *
 * MAKES A REAL API CALL and therefore costs real money (a few cents). It
 * exercises the same schema, prompt, streaming call, validation and
 * sanitization the route uses, and reports the measured token cost.
 *
 * It does NOT exercise the route's auth, rate-limit or usage-cap path — those
 * need a live Supabase project.
 */

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseSiteContent } from '../src/lib/content-model'
import { MODEL, RATES, costOf, formatUsd, type TokenUsage } from '../src/lib/generation-cost'
import {
  GENERATION_SYSTEM_PROMPT,
  generatedSite,
  generationUserPrompt,
} from '../src/lib/generation-schema'
import { PageView } from '../src/components/site-engine/render'

const rule = (t: string) => console.log('\n' + '='.repeat(72) + '\n' + t + '\n' + '='.repeat(72))

const SITE_TYPE = 'services'
const NAME = 'Harbour & Vane Roofing'
const BRIEF =
  'A family-run roofing company covering coastal towns. Flat roofs, slate repair, ' +
  'emergency leak callouts, and gutter work. They emphasise turning up when they say ' +
  'they will and giving a fixed quote before starting.'


/** Stands in for a model response when no credits are available. Shaped exactly
 *  as the schema requires, so the validation + sanitization path is real even
 *  when the network call is not. Includes a hostile href to prove sanitization. */
const FIXTURE = {
  siteType: 'services',
  pages: [
    { slug: '', title: 'Harbour & Vane Roofing', description: 'Roofing across the coastal towns.', showInNav: true,
      sections: [
        { variant: 'hero', blocks: [
          { type: 'heading', level: 1, text: 'Harbour & Vane Roofing' },
          { type: 'text', text: 'A family-run roofing company covering the coastal towns. Fixed quotes before we start, and we turn up when we say we will.' },
          { type: 'button', label: 'Request a quote', href: '/contact' } ] },
        { variant: 'grid', blocks: [
          { type: 'heading', level: 2, text: 'What we do' },
          { type: 'cards', items: [
            { title: 'Flat roofing', body: 'Installation and repair of flat roofs, with attention to drainage and standing water.' },
            { title: 'Slate repair', body: 'Replacing cracked and slipped slates, and matching existing work where we can.' },
            { title: 'Emergency callouts', body: 'Leak callouts when weather makes a roof urgent rather than scheduled.' } ] } ] },
        { variant: 'plain', blocks: [
          { type: 'quote', text: 'They gave us a fixed price and stuck to it, and the work was done when they said.', attribution: 'A customer' } ] },
      ] },
    { slug: 'services', title: 'Services', description: 'The full list of what we take on.', showInNav: true,
      sections: [ { variant: 'plain', blocks: [
        { type: 'heading', level: 1, text: 'Services' },
        { type: 'list', ordered: false, items: ['Flat roof installation and repair', 'Slate and tile repair', 'Gutter clearing and replacement', 'Emergency leak callouts'] },
        // Deliberately hostile — sanitizeUrl must neutralise this.
        { type: 'button', label: 'Get in touch', href: 'javascript:alert(1)' } ] } ] },
    { slug: 'contact', title: 'Contact', description: 'Request a fixed quote.', showInNav: true,
      sections: [ { variant: 'plain', blocks: [
        { type: 'heading', level: 1, text: 'Request a quote' },
        { type: 'contact', email: 'hello@example.com', phone: '', note: 'Tell us the address and what you are seeing, and we will quote before starting.' } ] } ] },
  ],
}

async function main() {
rule(`1. GENERATING a non-portfolio site (type: ${SITE_TYPE}) with ${MODEL}`)
console.log(`  name : ${NAME}`)
console.log(`  brief: ${BRIEF.slice(0, 80)}…\n`)

let message: Anthropic.Message | null = null
let liveError: string | null = null
const started = Date.now()

try {
  const anthropic = new Anthropic()
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 32_000,
    system: GENERATION_SYSTEM_PROMPT,
    output_config: { effort: 'medium', format: zodOutputFormat(generatedSite) },
    messages: [{ role: 'user', content: generationUserPrompt(SITE_TYPE, NAME, BRIEF) }],
  })
  let deltaCount = 0
  let streamedChars = 0
  stream.on('text', (d) => { deltaCount++; streamedChars += d.length })
  message = await stream.finalMessage()
  console.log(`  streamed ${deltaCount} deltas / ${streamedChars} chars`)
  console.log(`  stop_reason: ${message.stop_reason}`)
} catch (err) {
  liveError = String(err).split('\n')[0]
  console.log(`  LIVE CALL UNAVAILABLE: ${liveError}`)
  console.log('  Falling back to a fixture so the rest of the pipeline is still verified.')
  console.log('  Token cost CANNOT be measured without a live call — reported as UNMEASURED below.')
}

const elapsed = ((Date.now() - started) / 1000).toFixed(1)

if (message && (message.stop_reason === 'refusal' || message.stop_reason === 'max_tokens')) {
  console.error(`FAILED: stop_reason ${message.stop_reason}`)
  process.exit(1)
}

const raw = message
  ? message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
  : JSON.stringify(FIXTURE)

rule('2. SCHEMA VALIDATION (structured output → zod)')
const validated = generatedSite.safeParse(JSON.parse(raw))
console.log('  zod validation:', validated.success ? 'PASSED' : 'FAILED')
if (!validated.success) {
  console.error(validated.error.issues.slice(0, 5))
  process.exit(1)
}

rule('3. VALIDATED JSON (stored content model, after sanitization + id assignment)')
const site = parseSiteContent({ ...validated.data, theme: 'minimal' })
console.log(JSON.stringify(site, null, 2))

rule('4. PAGE / ROUTE MAP')
for (const p of site.pages) {
  console.log(
    `  ${(p.slug ? '/' + p.slug : '/').padEnd(14)} "${p.title}"  sections=${p.sections.length}`,
  )
}

rule('5. RENDERED HTML (home page)')
console.log(renderToStaticMarkup(PageView({ site, page: site.pages[0] }) as never))

rule('6. MEASURED TOKEN COST')
if (!message) {
  console.log('  UNMEASURED — the Anthropic account has no API credits, so no')
  console.log('  request could be billed and no usage object exists to read.')
  console.log(`  upstream said: ${liveError}`)
  console.log('')
  console.log(`  Rates that would apply (${MODEL}):`)
  console.log(`    input  $${RATES.inputPerMTok.toFixed(2)}/MTok`)
  console.log(`    output $${RATES.outputPerMTok.toFixed(2)}/MTok`)
  console.log('  The route records real usage per generation once credits exist.')
} else {
const usage = message.usage as TokenUsage
const cost = costOf(usage)
console.log(`  input tokens       : ${cost.inputTokens.toLocaleString()}`)
console.log(`  output tokens      : ${cost.outputTokens.toLocaleString()}`)
console.log(`  cache read tokens  : ${cost.cacheReadTokens.toLocaleString()}`)
console.log(`  cache write tokens : ${cost.cacheWriteTokens.toLocaleString()}`)
console.log(`  total tokens       : ${cost.totalTokens.toLocaleString()}`)
console.log(`  COST PER SITE      : ${formatUsd(cost.costUsd)}`)
console.log(`  wall clock         : ${elapsed}s`)
}

rule('7. SAFETY CHECKS ON GENERATED CONTENT')
const html = renderToStaticMarkup(PageView({ site, page: site.pages[0] }) as never)
const checks: [string, boolean][] = [
  ['no script tag in rendered html', html.includes('<script')],
  ['no javascript: url survived', /(?:href|src)="javascript:/i.test(html)],
  ['every button href is site-relative', site.pages.some((p) =>
    p.sections.some((s) =>
      s.blocks.some((b) => b.type === 'button' && !b.href.startsWith('/') && b.href !== '#'),
    ),
  )],
  ['exactly one home page', site.pages.filter((p) => p.slug === '').length !== 1],
  ['no duplicate slugs', new Set(site.pages.map((p) => p.slug)).size !== site.pages.length],
]
let bad = false
for (const [label, failed] of checks) {
  console.log(`  ${failed ? 'FAIL' : 'ok  '}  ${label}`)
  if (failed) bad = true
}

rule(bad ? 'CHECKS FAILED' : 'ALL GENERATION CHECKS PASSED')
process.exit(bad ? 1 : 0)
}

main().catch((err) => {
  console.error('verification failed:', err)
  process.exit(1)
})
