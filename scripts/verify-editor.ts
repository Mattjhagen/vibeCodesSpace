/*
 * Editor verification. Run from the repo root:
 *
 *   npx tsx --tsconfig tsconfig.verify.json scripts/verify-editor.ts
 *
 * Replays a recorded sequence of edits through the same pure operations the
 * builder UI calls, printing the stored model after each one. Exits non-zero
 * if any edit, reorder, undo or redo fails to take effect.
 *
 * The operations are pure precisely so this is checkable without a browser:
 * "did this sequence of edits produce that model" is a question about values.
 */

import { SiteContent } from '../src/lib/content-model'
import { startingContent } from '../src/lib/site-types'
import {
  History,
  addBlock,
  addSection,
  canRedo,
  canUndo,
  commit,
  initHistory,
  moveBlock,
  moveSection,
  redo,
  removeBlock,
  undo,
  updateBlock,
} from '../src/lib/editor-ops'

const rule = (t: string) => console.log('\n' + '='.repeat(72) + '\n' + t + '\n' + '='.repeat(72))

let failures = 0
function check(label: string, ok: boolean, detail = '') {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
  if (!ok) failures++
}

/** Compact, comparable rendering of a page's structure. */
function shape(site: SiteContent, pageId: string): string {
  const page = site.pages.find((p) => p.id === pageId)!
  return page.sections.map((s) => `${s.variant}[${s.blocks.map((b) => b.type).join(',')}]`).join(' | ')
}

function show(site: SiteContent, pageId: string, label: string) {
  console.log(`\n  ${label}\n    ${shape(site, pageId)}`)
}

// ------------------------------------------------------------------ setup

const start = startingContent('business', 'Northwind Plumbing')
const pageId = start.pages[0].id
let h: History<SiteContent> = initHistory(start)

rule('RECORDED EDIT SEQUENCE — stored model after each step')
show(h.present, pageId, 'step 0 — starting "business" site')
const shape0 = shape(h.present, pageId)

// --- 1. add a section -------------------------------------------------------
h = commit(h, addSection(h.present, { pageId, variant: 'band' }))
show(h.present, pageId, 'step 1 — addSection(variant: band)')
const shape1 = shape(h.present, pageId)
check(
  'add section took effect',
  h.present.pages[0].sections.length === start.pages[0].sections.length + 1,
  `${start.pages[0].sections.length} -> ${h.present.pages[0].sections.length} sections`,
)

// --- 2. add a block to that new section ------------------------------------
const newSection = h.present.pages[0].sections[h.present.pages[0].sections.length - 1]
h = commit(h, addBlock(h.present, { pageId, sectionId: newSection.id, type: 'stats' }))
show(h.present, pageId, 'step 2 — addBlock(type: stats) to the new section')
const shape2 = shape(h.present, pageId)
const grown = h.present.pages[0].sections[h.present.pages[0].sections.length - 1]
check(
  'add block took effect',
  grown.blocks.length === newSection.blocks.length + 1 && grown.blocks.some((b) => b.type === 'stats'),
  `${newSection.blocks.length} -> ${grown.blocks.length} blocks, last is ${grown.blocks[grown.blocks.length - 1].type}`,
)

// --- 3. reorder a block within its section ---------------------------------
const beforeOrder = grown.blocks.map((b) => b.type).join(',')
const lastBlock = grown.blocks[grown.blocks.length - 1]
h = commit(h, moveBlock(h.present, { pageId, blockId: lastBlock.id, delta: -1 }))
const afterSection = h.present.pages[0].sections[h.present.pages[0].sections.length - 1]
const afterOrder = afterSection.blocks.map((b) => b.type).join(',')
show(h.present, pageId, 'step 3 — moveBlock(stats, delta: -1)')
const shape3 = shape(h.present, pageId)
check('block reorder took effect', beforeOrder !== afterOrder, `${beforeOrder}  ->  ${afterOrder}`)
check(
  'stats moved up exactly one position',
  afterSection.blocks.findIndex((b) => b.id === lastBlock.id) ===
    grown.blocks.findIndex((b) => b.id === lastBlock.id) - 1,
)

// --- 4. reorder a section ---------------------------------------------------
const firstSectionId = h.present.pages[0].sections[0].id
h = commit(h, moveSection(h.present, { pageId, sectionId: firstSectionId, delta: 1 }))
show(h.present, pageId, 'step 4 — moveSection(first, delta: +1)')
const shape4 = shape(h.present, pageId)
check(
  'section reorder took effect',
  h.present.pages[0].sections[1].id === firstSectionId && shape4 !== shape3,
)

// --- 5. inline text edit ----------------------------------------------------
const heading = h.present.pages[0].sections
  .flatMap((s) => s.blocks)
  .find((b) => b.type === 'heading')!
h = commit(h, updateBlock(h.present, { pageId, block: { ...heading, text: 'Edited inline' } }))
const editedText = h.present.pages[0].sections
  .flatMap((s) => s.blocks)
  .find((b) => b.id === heading.id) as { text: string }
check('inline text edit took effect', editedText.text === 'Edited inline', `"${editedText.text}"`)

// --- 6. remove a block ------------------------------------------------------
const victim = h.present.pages[0].sections.flatMap((s) => s.blocks).find((b) => b.type === 'stats')!
h = commit(h, removeBlock(h.present, { pageId, blockId: victim.id }))
show(h.present, pageId, 'step 6 — removeBlock(stats)')
check(
  'remove block took effect',
  !h.present.pages[0].sections.flatMap((s) => s.blocks).some((b) => b.id === victim.id),
)

// ------------------------------------------------------------------- undo

rule('UNDO — each step reverts to the model that preceded it')
const expected = [
  ['undo remove block', shape4],
  ['undo text edit (structure unchanged)', shape4],
  ['undo section reorder', shape3],
  ['undo block reorder', shape2],
  ['undo add block', shape1],
  ['undo add section', shape0],
] as const

// The text edit did not change structure, so undoing it lands on shape4 too;
// stepping through both keeps the history depth honest.
h = undo(h) // remove block
check('undo add-block/remove step 1', shape(h.present, pageId) === expected[0][1])
h = undo(h) // text edit
check(expected[1][0], shape(h.present, pageId) === expected[1][1])
const headingAfterUndo = h.present.pages[0].sections
  .flatMap((s) => s.blocks)
  .find((b) => b.id === heading.id) as { text: string }
check('undo restored the original heading text', headingAfterUndo.text === heading.text, `"${headingAfterUndo.text}"`)

h = undo(h)
show(h.present, pageId, 'after undo × 3 — section reorder reverted')
check(expected[2][0], shape(h.present, pageId) === expected[2][1])

h = undo(h)
check(expected[3][0], shape(h.present, pageId) === expected[3][1])

h = undo(h)
check(expected[4][0], shape(h.present, pageId) === expected[4][1])

h = undo(h)
show(h.present, pageId, 'after undo × 6 — back to the starting model')
check(expected[5][0], shape(h.present, pageId) === expected[5][1])
check('history is exhausted', !canUndo(h))
check('undo past the start is a no-op', shape(undo(h).present, pageId) === shape0)

// ------------------------------------------------------------------- redo

rule('REDO')
check('redo is available after undoing', canRedo(h))
h = redo(h)
check('redo re-applies add section', shape(h.present, pageId) === shape1)
h = redo(h)
check('redo re-applies add block', shape(h.present, pageId) === shape2)
show(h.present, pageId, 'after redo × 2')

// A new edit after undo must discard the redo branch — the standard contract.
h = undo(h)
h = commit(h, addSection(h.present, { pageId, variant: 'plain' }))
check('editing after undo discards the redo branch', !canRedo(h))

rule(failures === 0 ? 'ALL EDITOR CHECKS PASSED' : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
