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
import { cn } from '@/lib/utils'

// --------------------------------------------------------------------- block

function BlockView({ block, inHero }: { block: Block; inHero: boolean }) {
  switch (block.type) {
    case 'heading': {
      const Tag = (`h${block.level}` as 'h1' | 'h2' | 'h3')
      return (
        <Tag
          className={cn(
            'font-bold tracking-tight text-balance',
            block.level === 1 && 'text-4xl sm:text-5xl lg:text-6xl',
            block.level === 2 && 'text-2xl sm:text-3xl',
            block.level === 3 && 'text-xl sm:text-2xl',
          )}
        >
          {block.text}
        </Tag>
      )
    }

    case 'text':
      return (
        <p
          className={cn(
            'leading-relaxed text-pretty',
            inHero ? 'text-lg sm:text-xl max-w-2xl' : 'max-w-prose',
            'text-muted-foreground',
          )}
        >
          {block.text}
        </p>
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

export function SectionView({ section }: { section: Section }) {
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
        {section.blocks.map((block) => (
          <BlockView key={block.id} block={block} inHero={inHero} />
        ))}
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
  return (
    <>
      <SiteNav items={navFor(site)} current={current} />
      <main>
        {page.sections.map((section) => (
          <SectionView key={section.id} section={section} />
        ))}
      </main>
    </>
  )
}
