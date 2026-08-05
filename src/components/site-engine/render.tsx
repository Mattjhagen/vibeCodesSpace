/**
 * Renderer for the v2 content model.
 *
 * Deliberately has no `dangerouslySetInnerHTML` anywhere. Every string arrives
 * as a JSX child, which React escapes, so the only injection surface left is
 * URLs — and those go through `sanitizeUrl` a second time here even though the
 * parser already cleaned them, because content can reach a renderer from a
 * cache or an older row that predates the current rules.
 */

import {
  Block,
  NavItem,
  Page,
  Section,
  SiteContent,
  navFor,
  sanitizeImageSrc,
  sanitizeUrl,
} from '@/lib/content-model'
import { themeInlineStyle } from '@/lib/site-themes'
import { cn } from '@/lib/utils'

/**
 * Editing affordances, supplied only by the builder.
 *
 * When absent the renderer produces exactly the markup a published site
 * serves — no wrappers, no data attributes, no editable elements. That is the
 * point of making it optional rather than a separate editing renderer: the
 * preview and the published page cannot drift.
 */
export interface EditHooks {
  selectedId: string | null
  onSelect: (blockId: string) => void
  onTextChange: (blockId: string, text: string) => void
}

/** Inline-editable text. Commits on blur so typing never re-renders the tree. */
function Editable({
  as: Tag,
  blockId,
  text,
  className,
  edit,
}: {
  as: 'h1' | 'h2' | 'h3' | 'p'
  blockId: string
  text: string
  className?: string
  edit?: EditHooks
}) {
  if (!edit) return <Tag className={className}>{text}</Tag>
  return (
    <Tag
      className={cn(className, 'outline-none focus:bg-primary/5 rounded-sm')}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e) => edit.onTextChange(blockId, e.currentTarget.textContent ?? '')}
    >
      {text}
    </Tag>
  )
}

// --------------------------------------------------------------------- block

function BlockView({
  block,
  inHero,
  edit,
}: {
  block: Block
  inHero: boolean
  edit?: EditHooks
}) {
  switch (block.type) {
    case 'heading':
      return (
        <Editable
          as={`h${block.level}` as 'h1' | 'h2' | 'h3'}
          blockId={block.id}
          text={block.text}
          edit={edit}
          className={cn(
            'font-bold tracking-tight text-balance',
            block.level === 1 && 'text-4xl sm:text-5xl lg:text-6xl',
            block.level === 2 && 'text-2xl sm:text-3xl',
            block.level === 3 && 'text-xl sm:text-2xl',
          )}
        />
      )

    case 'text':
      return (
        <Editable
          as="p"
          blockId={block.id}
          text={block.text}
          edit={edit}
          className={cn(
            'leading-relaxed text-pretty',
            inHero ? 'text-lg sm:text-xl max-w-2xl' : 'max-w-prose',
            'text-muted-foreground',
          )}
        />
      )

    case 'image':
      // Plain <img>: sites render on arbitrary hosts, so next/image's loader
      // and remote-pattern allowlist would be a liability here, not a win.
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          src={sanitizeImageSrc(block.src)}
          alt={block.alt}
          loading="lazy"
          decoding="async"
          className="w-full h-auto rounded-lg"
        />
      )

    case 'button': {
      const href = sanitizeUrl(block.href)
      const external = /^https?:/.test(href)
      return (
        <a
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {block.label}
        </a>
      )
    }

    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul'
      return (
        <Tag
          className={cn(
            'space-y-2 max-w-prose text-muted-foreground',
            block.ordered ? 'list-decimal pl-6' : 'list-disc pl-6',
          )}
        >
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </Tag>
      )
    }

    case 'cards':
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
          {block.items.map((card, i) => {
            const href = card.href ? sanitizeUrl(card.href) : ''
            const body = (
              <>
                {card.title && <h3 className="font-semibold text-lg">{card.title}</h3>}
                {card.body && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                )}
              </>
            )
            const classes =
              'block space-y-2 rounded-xl border border-border bg-card p-6 text-left'
            return href && href !== '#' ? (
              <a key={i} href={href} className={cn(classes, 'transition hover:bg-accent')}>
                {body}
              </a>
            ) : (
              <div key={i} className={classes}>
                {body}
              </div>
            )
          })}
        </div>
      )

    case 'stats':
      return (
        <dl className="grid gap-8 sm:grid-cols-3 w-full text-center">
          {block.items.map((stat, i) => (
            <div key={i} className="space-y-1">
              <dd className="text-3xl sm:text-4xl font-bold">{stat.value}</dd>
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            </div>
          ))}
        </dl>
      )

    case 'quote':
      return (
        <figure className="max-w-prose space-y-3">
          <blockquote className="border-l-4 border-border pl-4 text-lg italic">
            {block.text}
          </blockquote>
          {block.attribution && (
            <figcaption className="text-sm text-muted-foreground">
              — {block.attribution}
            </figcaption>
          )}
        </figure>
      )

    case 'contact':
      return (
        <address className="not-italic space-y-2 text-muted-foreground">
          {block.note && <p className="max-w-prose">{block.note}</p>}
          {block.email && (
            <p>
              <a className="underline underline-offset-4" href={sanitizeUrl(`mailto:${block.email}`)}>
                {block.email}
              </a>
            </p>
          )}
          {block.phone && (
            <p>
              <a className="underline underline-offset-4" href={sanitizeUrl(`tel:${block.phone}`)}>
                {block.phone}
              </a>
            </p>
          )}
        </address>
      )

    case 'divider':
      return <hr className="w-full border-border" />

    case 'gallery':
      if (!block.items.length) return null
      return (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 w-full">
          {block.items.map((item, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <figure key={i} className="overflow-hidden rounded-lg">
              <img
                src={sanitizeImageSrc(item.src)}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                className="w-full h-48 object-cover"
              />
              {item.caption && (
                <figcaption className="mt-1 text-xs text-muted-foreground text-center px-1">
                  {item.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )
  }
}

// ------------------------------------------------------------------- section

const VARIANT_CLASSES: Record<Section['variant'], string> = {
  hero: 'py-20 sm:py-28 items-center text-center',
  band: 'py-16 bg-muted/40 items-start',
  grid: 'py-16 items-start',
  split: 'py-16 items-start',
  plain: 'py-12 items-start',
}

export function SectionView({ section, edit }: { section: Section; edit?: EditHooks }) {
  const inHero = section.variant === 'hero'
  return (
    <section className={cn('px-6', VARIANT_CLASSES[section.variant])}>
      <div
        className={cn(
          'mx-auto flex w-full max-w-5xl flex-col gap-6',
          inHero && 'items-center',
          section.variant === 'split' && 'sm:flex-row sm:gap-12 sm:items-start',
        )}
      >
        {section.blocks.map((block) =>
          edit ? (
            <div
              key={block.id}
              data-block-id={block.id}
              onClick={(e) => {
                e.stopPropagation()
                edit.onSelect(block.id)
              }}
              className={cn(
                'relative w-full cursor-pointer rounded-sm ring-offset-2 transition',
                edit.selectedId === block.id ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/40',
              )}
            >
              <BlockView block={block} inHero={inHero} edit={edit} />
            </div>
          ) : (
            <BlockView key={block.id} block={block} inHero={inHero} />
          ),
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------- nav

export function SiteNav({ items, current }: { items: NavItem[]; current: string }) {
  if (items.length < 2) return null
  return (
    <nav aria-label="Site" className="border-b border-border px-6">
      <ul className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 py-4 text-sm">
        {items.map((item) => {
          const active = item.href === current
          return (
            <li key={item.href}>
              <a
                href={sanitizeUrl(item.href)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'underline-offset-4 hover:underline',
                  active ? 'font-semibold' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ---------------------------------------------------------------------- page

export function PageView({ site, page }: { site: SiteContent; page: Page }) {
  const current = page.slug ? `/${page.slug}` : '/'
  const themeStyle = themeInlineStyle(site.theme) as React.CSSProperties
  return (
    <div style={themeStyle} className="min-h-screen">
      <SiteNav items={navFor(site)} current={current} />
      <main>
        {page.sections.map((section) => (
          <SectionView key={section.id} section={section} />
        ))}
      </main>
    </div>
  )
}
