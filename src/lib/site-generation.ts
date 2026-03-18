export interface SiteSection {
  id: string;
  type: 'hero' | 'about' | 'experience' | 'skills' | 'contact';
  content: any;
}

export interface SiteContent {
  sections: SiteSection[];
}

export function generateInitialContent(goal: string, theme: string): SiteContent {
  const sections: SiteSection[] = [
    {
      id: 'hero-1',
      type: 'hero',
      content: {
        title: `Welcome to my ${goal} Site`,
        subtitle: `Professional ${goal} built with pride using VibeCodes.`,
        cta: 'Get in Touch'
      }
    },
    {
      id: 'about-1',
      type: 'about',
      content: {
        title: 'About Me',
        text: `I am a dedicated professional focused on ${goal.toLowerCase()}. With years of experience and a passion for excellence, I strive to deliver the best results for my clients and partners.`
      }
    },
    {
      id: 'skills-1',
      type: 'skills',
      content: {
        title: 'Key Expertise',
        items: ['Strategic Planning', 'Digital Innovation', 'Project Management', 'Client Relations']
      }
    },
    {
      id: 'contact-1',
      type: 'contact',
      content: {
        title: 'Let\'s Connect',
        email: 'hello@example.com',
        description: 'I am always open to new opportunities and collaborations.'
      }
    }
  ];

  return { sections };
}
