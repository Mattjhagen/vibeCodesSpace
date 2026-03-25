import { SiteSection } from '@/lib/site-generation'
import { cn } from '@/lib/utils'

export function HeroSection({ content, theme }: { content: any, theme?: string }) {
  const isStartup = theme === 'Startup Profile'
  const isCreative = theme === 'Creative Portfolio'

  return (
    <section className={cn(
      "py-24 px-6 text-center space-y-6 transition-colors duration-500",
      isStartup ? "bg-slate-950 text-white" : isCreative ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white" : "bg-background text-foreground"
    )}>
      <h1 className={cn(
        "text-5xl font-extrabold tracking-tight sm:text-7xl",
        isStartup ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500" : ""
      )}>
        {content.title}
      </h1>
      <p className={cn(
        "text-xl max-w-2xl mx-auto",
        isStartup || isCreative ? "text-white/80" : "text-muted-foreground"
      )}>
        {content.subtitle}
      </p>
      {content.cta && (
        <button className={cn(
          "mt-8 px-10 py-4 rounded-full font-bold shadow-2xl transition-all hover:scale-105 active:scale-95",
          isStartup ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400" : isCreative ? "bg-white text-purple-600 hover:bg-slate-50" : "bg-primary text-primary-foreground"
        )}>
          {content.cta}
        </button>
      )}
    </section>
  )
}

export function AboutSection({ content, theme }: { content: any, theme?: string }) {
  const isStartup = theme === 'Startup Profile'
  const isCreative = theme === 'Creative Portfolio'

  return (
    <section className={cn(
      "py-20 px-6 transition-colors duration-500",
      isStartup ? "bg-slate-900 text-slate-300" : isCreative ? "bg-slate-50 text-slate-900" : "bg-background text-foreground"
    )}>
      <div className="max-w-4xl mx-auto space-y-6 text-center md:text-left">
        <h2 className={cn(
          "text-4xl font-bold mb-4",
          isStartup ? "text-cyan-400" : isCreative ? "text-purple-600" : ""
        )}>{content.title}</h2>
        <p className="text-xl leading-relaxed opacity-90">
          {content.text}
        </p>
      </div>
    </section>
  )
}

export function SkillsSection({ content, theme }: { content: any, theme?: string }) {
  const isStartup = theme === 'Startup Profile'
  const isCreative = theme === 'Creative Portfolio'

  return (
    <section className={cn(
      "py-20 px-6 transition-colors duration-500",
      isStartup ? "bg-slate-950 text-white" : isCreative ? "bg-white text-slate-900" : "bg-background text-foreground"
    )}>
      <div className="max-w-4xl mx-auto space-y-10">
        <h2 className="text-4xl font-bold text-center">{content.title}</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {content.items?.map((skill: string) => (
            <span key={skill} className={cn(
              "px-6 py-3 rounded-2xl font-semibold shadow-sm transition-all hover:-translate-y-1",
              isStartup ? "bg-slate-800 border border-cyan-500/30 text-cyan-400" : isCreative ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700" : "bg-secondary text-secondary-foreground"
            )}>
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ContactSection({ content, theme }: { content: any, theme?: string }) {
  const isStartup = theme === 'Startup Profile'
  const isCreative = theme === 'Creative Portfolio'

  return (
    <section className={cn(
      "py-24 px-6 text-center border-t transition-colors duration-500",
      isStartup ? "bg-slate-900 border-slate-800 text-white" : isCreative ? "bg-slate-50 border-purple-100 text-slate-900" : "bg-muted/10"
    )}>
      <h2 className="text-4xl font-bold mb-6">{content.title}</h2>
      <p className="text-xl opacity-80 mb-10 max-w-xl mx-auto">
        {content.description}
      </p>
      <a 
        href={`mailto:${content.email}`} 
        className={cn(
          "text-2xl font-bold transition-all hover:opacity-70",
          isStartup ? "text-cyan-400" : isCreative ? "text-purple-600" : "text-primary"
        )}
      >
        {content.email}
      </a>
    </section>
  )
}

export function ExperienceSection({ content, theme }: { content: any, theme?: string }) {
  const isStartup = theme === 'Startup Profile'
  const isCreative = theme === 'Creative Portfolio'

  return (
    <section className={cn(
      "py-20 px-6 transition-colors duration-500",
      isStartup ? "bg-slate-900 text-slate-300" : isCreative ? "bg-white text-slate-900" : "bg-background text-foreground"
    )}>
      <div className="max-w-4xl mx-auto space-y-10">
        <h2 className={cn(
          "text-4xl font-bold text-center",
          isStartup ? "text-cyan-400" : isCreative ? "text-purple-600" : ""
        )}>{content.title}</h2>
        <div className="space-y-6">
          {content.jobs?.map((job: { role: string; company: string; years: string; desc: string }, idx: number) => (
            <div key={idx} className={cn(
              "p-6 rounded-xl border",
              isStartup ? "border-slate-700 bg-slate-800/50" : isCreative ? "border-purple-100 bg-purple-50/30" : "border-border bg-card"
            )}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-1">
                <div>
                  <span className="font-bold text-lg">{job.role}</span>
                  <span className={cn("ml-2 font-medium", isStartup ? "text-cyan-400" : isCreative ? "text-purple-600" : "text-primary")}>
                    @ {job.company}
                  </span>
                </div>
                <span className="text-sm opacity-60">{job.years}</span>
              </div>
              <p className="text-sm leading-relaxed opacity-80">{job.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function RenderSection({ section, theme }: { section: SiteSection, theme?: string }) {
  switch (section.type) {
    case 'hero':
      return <HeroSection content={section.content} theme={theme} />
    case 'about':
      return <AboutSection content={section.content} theme={theme} />
    case 'experience':
      return <ExperienceSection content={section.content} theme={theme} />
    case 'skills':
      return <SkillsSection content={section.content} theme={theme} />
    case 'contact':
      return <ContactSection content={section.content} theme={theme} />
    default:
      return null
  }
}
