import { SiteSection } from '@/lib/site-generation'

export function HeroSection({ content }: { content: any }) {
  return (
    <section className="py-20 px-6 text-center space-y-6">
      <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-foreground">
        {content.title}
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        {content.subtitle}
      </p>
      {content.cta && (
        <button className="mt-8 px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold shadow-lg hover:shadow-xl transition-all">
          {content.cta}
        </button>
      )}
    </section>
  )
}

export function AboutSection({ content }: { content: any }) {
  return (
    <section className="py-16 px-6 max-w-4xl mx-auto space-y-4">
      <h2 className="text-3xl font-bold">{content.title}</h2>
      <p className="text-lg leading-relaxed text-muted-foreground">
        {content.text}
      </p>
    </section>
  )
}

export function SkillsSection({ content }: { content: any }) {
  return (
    <section className="py-16 px-6 max-w-4xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold">{content.title}</h2>
      <div className="flex flex-wrap gap-3">
        {content.items?.map((skill: string) => (
          <span key={skill} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium shadow-sm transition-transform hover:scale-105">
            {skill}
          </span>
        ))}
      </div>
    </section>
  )
}

export function ContactSection({ content }: { content: any }) {
  return (
    <section className="py-20 px-6 text-center bg-muted/20 border-t">
      <h2 className="text-3xl font-bold mb-4">{content.title}</h2>
      <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
        {content.description}
      </p>
      <a href={`mailto:${content.email}`} className="text-xl font-semibold text-primary hover:underline">
        {content.email}
      </a>
    </section>
  )
}

export function RenderSection({ section }: { section: SiteSection }) {
  switch (section.type) {
    case 'hero':
      return <HeroSection content={section.content} />
    case 'about':
      return <AboutSection content={section.content} />
    case 'skills':
      return <SkillsSection content={section.content} />
    case 'contact':
      return <ContactSection content={section.content} />
    default:
      return null
  }
}
