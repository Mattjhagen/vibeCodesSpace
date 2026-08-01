/**
 * Starting compositions for each site type.
 *
 * A site type is *where you begin*, not what you are. Every type below is
 * assembled from the same small set of section factories, and nothing
 * downstream branches on `siteType` — the renderer, the editor and the
 * publisher all see blocks. A "business" site edited into a portfolio is
 * simply a site whose blocks changed, which is the property v1 lacked when it
 * hardcoded five portfolio section components.
 */

import {
  CONTENT_MODEL_VERSION,
  Block,
  Page,
  Section,
  SectionVariant,
  SiteContent,
  SiteType,
  parseSiteContent,
} from './content-model'

// --------------------------------------------------------- block factories

let seq = 0
const uid = (p: string) => `${p}-${(seq += 1).toString(36)}`

const heading = (text: string, level: 1 | 2 | 3 = 2): Block =>
  ({ id: uid('b'), type: 'heading', level, text })

const text = (body: string): Block => ({ id: uid('b'), type: 'text', text: body })

const button = (label: string, href = '#'): Block =>
  ({ id: uid('b'), type: 'button', label, href })

const list = (items: string[], ordered = false): Block =>
  ({ id: uid('b'), type: 'list', ordered, items })

const cards = (items: { title: string; body: string; href?: string }[]): Block =>
  ({ id: uid('b'), type: 'cards', items: items.map((c) => ({ href: '', ...c })) })

const stats = (items: { label: string; value: string }[]): Block =>
  ({ id: uid('b'), type: 'stats', items })

const quote = (body: string, attribution = ''): Block =>
  ({ id: uid('b'), type: 'quote', text: body, attribution })

const contact = (note: string, email = '', phone = ''): Block =>
  ({ id: uid('b'), type: 'contact', email, phone, note })

const section = (variant: SectionVariant, blocks: Block[]): Section =>
  ({ id: uid('s'), variant, blocks })

const page = (
  slug: string,
  title: string,
  description: string,
  sections: Section[],
  showInNav = true,
): Page => ({ id: uid('p'), slug, title, description, showInNav, sections })

/** The opening section every type shares, differing only in its words. */
const heroFor = (title: string, blurb: string, cta: string): Section =>
  section('hero', [heading(title, 1), text(blurb), button(cta, '/contact')])

// ------------------------------------------------------------ compositions

type Composer = (name: string) => Page[]

const COMPOSERS: Record<SiteType, Composer> = {
  portfolio: (name) => [
    page('', name, `Selected work by ${name}.`, [
      heroFor(name, `Designer and maker. This is a short introduction to who ${name} is and the work they do.`, 'Get in touch'),
      section('band', [
        heading('About'),
        text('A paragraph about background, focus, and the kind of work you want more of.'),
      ]),
      section('grid', [
        heading('Selected work'),
        cards([
          { title: 'Project one', body: 'What it was, what you did, and what changed as a result.' },
          { title: 'Project two', body: 'A second piece of work, described the same way.' },
          { title: 'Project three', body: 'A third, so the grid reads as a set.' },
        ]),
      ]),
    ]),
    page('contact', 'Contact', `Get in touch with ${name}.`, [
      section('plain', [heading('Contact', 1), contact('The best way to reach me.', 'hello@example.com')]),
    ]),
  ],

  business: (name) => [
    page('', name, `${name} — what we do and who we do it for.`, [
      heroFor(name, 'One sentence on what the business does and who it is for.', 'Talk to us'),
      section('grid', [
        heading('What we do'),
        cards([
          { title: 'First offering', body: 'What it is and who needs it.' },
          { title: 'Second offering', body: 'What it is and who needs it.' },
          { title: 'Third offering', body: 'What it is and who needs it.' },
        ]),
      ]),
      section('band', [stats([
        { label: 'Years in business', value: '10+' },
        { label: 'Clients served', value: '200' },
        { label: 'Average rating', value: '4.9' },
      ])]),
      section('plain', [quote('A short line from a customer explaining what changed for them.', 'A customer')]),
    ]),
    page('about', 'About', `About ${name}.`, [
      section('plain', [heading('About', 1), text('The story of the business, in a couple of paragraphs.')]),
    ]),
    page('contact', 'Contact', `Contact ${name}.`, [
      section('plain', [heading('Contact', 1), contact('Reach us during business hours.', 'hello@example.com', '')]),
    ]),
  ],

  services: (name) => [
    page('', name, `Services offered by ${name}.`, [
      heroFor(name, 'What you do, for whom, and the outcome they get.', 'Request a quote'),
      section('split', [
        heading('How it works'),
        list(['Get in touch and tell us what you need', 'We scope the work and quote it', 'We deliver, and you review'], true),
      ]),
    ]),
    page('services', 'Services', 'The full list of services.', [
      section('grid', [
        heading('Services', 1),
        cards([
          { title: 'Service one', body: 'What is included and what it costs.' },
          { title: 'Service two', body: 'What is included and what it costs.' },
        ]),
      ]),
    ]),
    page('contact', 'Contact', 'Request a quote.', [
      section('plain', [heading('Request a quote', 1), contact('Tell us about the job.', 'hello@example.com')]),
    ]),
  ],

  blog: (name) => [
    page('', name, `Writing by ${name}.`, [
      section('hero', [heading(name, 1), text('A short line about what this blog is about.')]),
      section('grid', [
        heading('Recent posts'),
        cards([
          { title: 'A first post', body: 'A one-line summary of what the post argues.' },
          { title: 'A second post', body: 'A one-line summary of what the post argues.' },
        ]),
      ]),
    ]),
    page('archive', 'Archive', 'Everything published so far.', [
      section('plain', [heading('Archive', 1), list(['A first post', 'A second post'])]),
    ]),
    page('about', 'About', `About ${name}.`, [
      section('plain', [heading('About', 1), text('Who writes here and why.')]),
    ]),
  ],

  docs: (name) => [
    page('', name, `${name} documentation.`, [
      section('hero', [heading(`${name} docs`, 1), text('What this documents, and who it is for.')]),
      section('grid', [
        heading('Start here'),
        cards([
          { title: 'Installation', body: 'Getting set up from nothing.', href: '/installation' },
          { title: 'Guides', body: 'Task-shaped walkthroughs.', href: '/guides' },
        ]),
      ]),
    ]),
    page('installation', 'Installation', 'How to install and configure.', [
      section('plain', [heading('Installation', 1), list(['Install the package', 'Add configuration', 'Verify it runs'], true)]),
    ]),
    page('guides', 'Guides', 'Task-shaped walkthroughs.', [
      section('plain', [heading('Guides', 1), text('Each guide covers one task end to end.')]),
    ]),
  ],

  event: (name) => [
    page('', name, `${name} — date, place and tickets.`, [
      heroFor(name, 'What the event is, when it happens, and where.', 'Get tickets'),
      section('band', [stats([
        { label: 'Date', value: 'TBC' },
        { label: 'Venue', value: 'TBC' },
        { label: 'Tickets', value: 'From $0' },
      ])]),
      section('grid', [
        heading('Speakers'),
        cards([
          { title: 'A speaker', body: 'What they will talk about.' },
          { title: 'Another speaker', body: 'What they will talk about.' },
        ]),
      ]),
    ]),
    page('schedule', 'Schedule', 'The running order.', [
      section('plain', [heading('Schedule', 1), list(['09:00 — Doors', '10:00 — First session', '16:00 — Close'], true)]),
    ]),
    page('tickets', 'Tickets', 'How to attend.', [
      section('plain', [heading('Tickets', 1), text('Pricing and how to book.'), button('Book now', '#')]),
    ]),
  ],
}

/**
 * Build the starting content for a site.
 *
 * Runs through `parseSiteContent` so a starter is validated by exactly the
 * same path as generated or user-edited content — if a composition above were
 * malformed, it would be caught here rather than at render time.
 */
export function startingContent(
  siteType: SiteType,
  name: string,
  theme = 'minimal',
): SiteContent {
  const compose = COMPOSERS[siteType] ?? COMPOSERS.portfolio
  return parseSiteContent({
    version: CONTENT_MODEL_VERSION,
    siteType,
    theme,
    pages: compose(name || 'Untitled'),
  })
}

/** Human-facing labels for the site-type picker. */
export const SITE_TYPE_LABELS: Record<SiteType, string> = {
  portfolio: 'Portfolio / resume',
  business: 'Business / landing',
  services: 'Services',
  blog: 'Blog',
  docs: 'Documentation',
  event: 'Event',
}
