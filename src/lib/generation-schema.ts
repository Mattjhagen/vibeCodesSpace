/**
 * The schema the model must generate against.
 *
 * This mirrors the v2 content model minus the fields the server owns. Ids are
 * deliberately absent: the model has no basis for inventing stable ids, and
 * `parseSiteContent` assigns them on the way in. That gives two independent
 * layers — structured output guarantees the *shape*, and parseSiteContent
 * guarantees it is *safe* (URL sanitization, length caps, slug de-duplication).
 * Neither is sufficient alone: a schema-valid response can still carry a
 * `javascript:` href.
 *
 * `image` is excluded on purpose. A language model has no way to know a real
 * image URL for someone's business, so every generated `src` would be either
 * invented or a placeholder the owner has to replace — worse than an empty
 * slot they fill in the editor.
 */

import { z } from 'zod'
import { SECTION_VARIANTS, SITE_TYPES } from './content-model'

const headingBlock = z.object({
  type: z.literal('heading'),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  text: z.string(),
})

const textBlock = z.object({
  type: z.literal('text'),
  text: z.string(),
})

const buttonBlock = z.object({
  type: z.literal('button'),
  label: z.string(),
  // Site-relative only. The model is told to link between the pages it
  // generates; sanitizeUrl rejects anything else on the way in regardless.
  href: z.string(),
})

const listBlock = z.object({
  type: z.literal('list'),
  ordered: z.boolean(),
  items: z.array(z.string()),
})

const cardsBlock = z.object({
  type: z.literal('cards'),
  items: z.array(z.object({ title: z.string(), body: z.string() })),
})

const statsBlock = z.object({
  type: z.literal('stats'),
  items: z.array(z.object({ label: z.string(), value: z.string() })),
})

const quoteBlock = z.object({
  type: z.literal('quote'),
  text: z.string(),
  attribution: z.string(),
})

const contactBlock = z.object({
  type: z.literal('contact'),
  email: z.string(),
  phone: z.string(),
  note: z.string(),
})

export const generatedBlock = z.discriminatedUnion('type', [
  headingBlock, textBlock, buttonBlock, listBlock,
  cardsBlock, statsBlock, quoteBlock, contactBlock,
])

export const generatedSection = z.object({
  variant: z.enum(SECTION_VARIANTS as [string, ...string[]]),
  blocks: z.array(generatedBlock),
})

export const generatedPage = z.object({
  // "" is the home page; everything else is slugified server-side.
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  showInNav: z.boolean(),
  sections: z.array(generatedSection),
})

export const generatedSite = z.object({
  siteType: z.enum(SITE_TYPES as [string, ...string[]]),
  pages: z.array(generatedPage),
})

export type GeneratedSite = z.infer<typeof generatedSite>

export const GENERATION_SYSTEM_PROMPT = `You generate website content as structured data for a site builder.

You are given a site type and a description of the business or person. Produce a complete, multi-page site.

Rules:
- The home page must have slug "" (empty string). Every other page has a short lowercase slug with no leading slash.
- Write real, specific copy based on what you are told. Do not emit placeholder text like "Lorem ipsum", "Your text here", or "Coming soon".
- If a detail was not provided, write something plausible and generic rather than inventing a specific factual claim — no invented prices, awards, client names, statistics, or years in business.
- Every "button" href must point at one of the pages you generate, written as "/slug" (or "/" for home). Never use an external URL.
- Use the section variants meaningfully: "hero" once at the top of the home page, "grid" for card sets, "band" for a contrasting strip, "split" for side-by-side, "plain" otherwise.
- Aim for 3-5 pages, each with 2-4 sections. Prefer fewer, better sections over padding.
- Keep the writing concise and concrete. No marketing filler.`

export function generationUserPrompt(siteType: string, name: string, brief: string): string {
  return [
    `Site type: ${siteType}`,
    `Name: ${name}`,
    '',
    'Description:',
    brief.trim() || '(no description given — write a sensible starting site for this type)',
  ].join('\n')
}
