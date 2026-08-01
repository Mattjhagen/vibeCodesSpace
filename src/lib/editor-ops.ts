/**
 * Editor operations and undo/redo, as pure functions over the content model.
 *
 * Nothing here touches React or the DOM. That is deliberate: the editor's
 * correctness is "does this sequence of edits produce that model", which is
 * only checkable if the operations are values-in/values-out. The UI is a thin
 * layer that calls these and re-renders.
 *
 * Every operation returns a new site through `parseSiteContent`, so an edit
 * can never write a shape the renderer would reject — the same validation the
 * server action applies, applied on every keystroke.
 */

import {
  Block,
  BlockType,
  Page,
  Section,
  SectionVariant,
  SiteContent,
  parseSiteContent,
} from './content-model'

let seq = 0
const uid = (p: string) => `${p}-e${(seq += 1).toString(36)}`

/** A sensible starting value for each block type. */
export function defaultBlock(type: BlockType): Block {
  const id = uid('b')
  switch (type) {
    case 'heading':
      return { id, type: 'heading', level: 2, text: 'New heading' }
    case 'text':
      return { id, type: 'text', text: 'New paragraph. Click to edit.' }
    case 'image':
      return { id, type: 'image', src: 'https://placehold.co/1200x600', alt: '' }
    case 'button':
      return { id, type: 'button', label: 'Button', href: '#' }
    case 'list':
      return { id, type: 'list', ordered: false, items: ['First item', 'Second item'] }
    case 'cards':
      return {
        id, type: 'cards',
        items: [
          { title: 'Card one', body: 'Describe it here.', href: '' },
          { title: 'Card two', body: 'Describe it here.', href: '' },
        ],
      }
    case 'stats':
      return {
        id, type: 'stats',
        items: [
          { label: 'A number', value: '100' },
          { label: 'Another', value: '4.9' },
        ],
      }
    case 'quote':
      return { id, type: 'quote', text: 'Something someone said.', attribution: 'Their name' }
    case 'contact':
      return { id, type: 'contact', email: 'hello@example.com', phone: '', note: 'How to reach us.' }
    case 'divider':
      return { id, type: 'divider' }
  }
}

/**
 * A new section always arrives with a block in it.
 *
 * `parseSection` drops empty sections, so inserting a bare one would vanish on
 * the next validation pass and look like the button did nothing.
 */
export function defaultSection(variant: SectionVariant = 'plain'): Section {
  return { id: uid('s'), variant, blocks: [defaultBlock('heading'), defaultBlock('text')] }
}

export function defaultPage(title: string): Page {
  return {
    id: uid('p'),
    slug: '',           // parseSiteContent slugifies from the title
    title,
    description: '',
    showInNav: true,
    sections: [defaultSection('plain')],
  }
}

// --------------------------------------------------------------- internals

/** Rebuild one page in place, leaving every other page identical. */
function withPage(
  site: SiteContent,
  pageId: string,
  fn: (page: Page) => Page,
): SiteContent {
  return parseSiteContent({
    ...site,
    pages: site.pages.map((p) => (p.id === pageId ? fn(p) : p)),
  })
}

function withSection(page: Page, sectionId: string, fn: (s: Section) => Section): Page {
  return { ...page, sections: page.sections.map((s) => (s.id === sectionId ? fn(s) : s)) }
}

/** Move an item within an array. Out-of-range targets clamp rather than throw. */
function reorder<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length) return items
  const target = Math.max(0, Math.min(items.length - 1, to))
  if (target === from) return items
  const next = items.slice()
  const [moved] = next.splice(from, 1)
  next.splice(target, 0, moved)
  return next
}

export function findSectionIdForBlock(page: Page, blockId: string): string | undefined {
  return page.sections.find((s) => s.blocks.some((b) => b.id === blockId))?.id
}

// --------------------------------------------------------------- block ops

export function addBlock(
  site: SiteContent,
  args: { pageId: string; sectionId: string; type: BlockType; index?: number },
): SiteContent {
  const block = defaultBlock(args.type)
  return withPage(site, args.pageId, (page) =>
    withSection(page, args.sectionId, (section) => {
      const at = args.index ?? section.blocks.length
      const blocks = section.blocks.slice()
      blocks.splice(Math.max(0, Math.min(blocks.length, at)), 0, block)
      return { ...section, blocks }
    }),
  )
}

export function updateBlock(
  site: SiteContent,
  args: { pageId: string; block: Block },
): SiteContent {
  return withPage(site, args.pageId, (page) => ({
    ...page,
    sections: page.sections.map((s) => ({
      ...s,
      blocks: s.blocks.map((b) => (b.id === args.block.id ? args.block : b)),
    })),
  }))
}

/**
 * Remove a block, and the section with it if that empties the section.
 *
 * Validation would drop the empty section anyway; doing it here makes the
 * behaviour explicit rather than an emergent side effect.
 */
export function removeBlock(
  site: SiteContent,
  args: { pageId: string; blockId: string },
): SiteContent {
  return withPage(site, args.pageId, (page) => ({
    ...page,
    sections: page.sections
      .map((s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== args.blockId) }))
      .filter((s) => s.blocks.length > 0),
  }))
}

/** Move a block within its own section. `delta` of -1 is up, +1 is down. */
export function moveBlock(
  site: SiteContent,
  args: { pageId: string; blockId: string; delta: number },
): SiteContent {
  return withPage(site, args.pageId, (page) => {
    const sectionId = findSectionIdForBlock(page, args.blockId)
    if (!sectionId) return page
    return withSection(page, sectionId, (section) => {
      const from = section.blocks.findIndex((b) => b.id === args.blockId)
      return { ...section, blocks: reorder(section.blocks, from, from + args.delta) }
    })
  })
}

// ------------------------------------------------------------- section ops

export function addSection(
  site: SiteContent,
  args: { pageId: string; variant?: SectionVariant; index?: number },
): SiteContent {
  const section = defaultSection(args.variant ?? 'plain')
  return withPage(site, args.pageId, (page) => {
    const at = args.index ?? page.sections.length
    const sections = page.sections.slice()
    sections.splice(Math.max(0, Math.min(sections.length, at)), 0, section)
    return { ...page, sections }
  })
}

export function removeSection(
  site: SiteContent,
  args: { pageId: string; sectionId: string },
): SiteContent {
  return withPage(site, args.pageId, (page) => ({
    ...page,
    sections: page.sections.filter((s) => s.id !== args.sectionId),
  }))
}

export function moveSection(
  site: SiteContent,
  args: { pageId: string; sectionId: string; delta: number },
): SiteContent {
  return withPage(site, args.pageId, (page) => {
    const from = page.sections.findIndex((s) => s.id === args.sectionId)
    return { ...page, sections: reorder(page.sections, from, from + args.delta) }
  })
}

export function setSectionVariant(
  site: SiteContent,
  args: { pageId: string; sectionId: string; variant: SectionVariant },
): SiteContent {
  return withPage(site, args.pageId, (page) =>
    withSection(page, args.sectionId, (s) => ({ ...s, variant: args.variant })),
  )
}

// ---------------------------------------------------------------- page ops

export function addPage(site: SiteContent, args: { title: string }): SiteContent {
  return parseSiteContent({ ...site, pages: [...site.pages, defaultPage(args.title)] })
}

export function removePage(site: SiteContent, args: { pageId: string }): SiteContent {
  // Never delete the last page: a site with no pages has nothing to route to,
  // and the editor would have nothing to show.
  if (site.pages.length <= 1) return site
  return parseSiteContent({
    ...site,
    pages: site.pages.filter((p) => p.id !== args.pageId),
  })
}

export function renamePage(
  site: SiteContent,
  args: { pageId: string; title: string },
): SiteContent {
  return withPage(site, args.pageId, (page) => ({ ...page, title: args.title }))
}

// ------------------------------------------------------------ undo / redo

export interface History<T> {
  past: T[]
  present: T
  future: T[]
}

/** Bounded so a long session cannot grow the tab's memory without limit. */
export const HISTORY_LIMIT = 50

export function initHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] }
}

/**
 * Record a new state.
 *
 * Redo history is discarded, which is the standard contract: once you edit
 * after undoing, the branch you undid is gone. Identical consecutive states
 * are ignored so a no-op edit does not consume an undo step.
 */
export function commit<T>(history: History<T>, next: T): History<T> {
  if (Object.is(history.present, next)) return history
  const past = [...history.past, history.present]
  return {
    past: past.length > HISTORY_LIMIT ? past.slice(past.length - HISTORY_LIMIT) : past,
    present: next,
    future: [],
  }
}

export function canUndo<T>(h: History<T>): boolean {
  return h.past.length > 0
}

export function canRedo<T>(h: History<T>): boolean {
  return h.future.length > 0
}

export function undo<T>(history: History<T>): History<T> {
  if (!history.past.length) return history
  const previous = history.past[history.past.length - 1]
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  }
}

export function redo<T>(history: History<T>): History<T> {
  if (!history.future.length) return history
  const [next, ...rest] = history.future
  return { past: [...history.past, history.present], present: next, future: rest }
}
