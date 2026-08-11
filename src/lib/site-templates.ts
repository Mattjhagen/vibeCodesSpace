import type { SiteContent } from './content-model'

export interface SiteTemplate {
  id: string
  name: string
  description: string
  category: string
  themeId: string
  thumbnail: string // Unsplash URL shown in the picker card
  plan: 'free' | 'pro' | 'business'
  content: SiteContent
}

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?w=1200&q=80&fit=crop&auto=format`

export const SITE_TEMPLATES: SiteTemplate[] = [
  // ──────────────────────────────────────────────────────────── Personal Resume
  {
    id: 'resume',
    name: 'Personal Resume',
    description: 'Clean CV with skills, experience, and a contact section.',
    category: 'Personal',
    themeId: 'clean',
    thumbnail: IMG('photo-1507003211169-0a1dd7228f2d'),
    plan: 'free',
    content: {
      version: 2,
      siteType: 'portfolio',
      theme: 'clean',
      pages: [
        {
          id: 'p1',
          slug: '',
          title: 'Home',
          description: 'My professional resume',
          showInNav: true,
          sections: [
            {
              id: 's1',
              variant: 'hero',
              blocks: [
                { id: 'b1', type: 'image', src: IMG('photo-1507003211169-0a1dd7228f2d'), alt: 'Professional photo' },
                { id: 'b2', type: 'heading', level: 1, text: 'Your Name' },
                { id: 'b3', type: 'text', text: 'Software Engineer · Product Designer · Creative Problem Solver' },
                { id: 'b4', type: 'button', label: 'Download Resume', href: '#' },
              ],
            },
            {
              id: 's2',
              variant: 'plain',
              blocks: [
                { id: 'b5', type: 'heading', level: 2, text: 'About Me' },
                { id: 'b6', type: 'text', text: 'I am a passionate professional with over 5 years of experience delivering high-quality work. I thrive in collaborative environments and love turning complex problems into elegant solutions.' },
              ],
            },
            {
              id: 's3',
              variant: 'plain',
              blocks: [
                { id: 'b7', type: 'heading', level: 2, text: 'Skills' },
                { id: 'b8', type: 'list', ordered: false, items: ['React & Next.js', 'TypeScript', 'UI/UX Design', 'Node.js & REST APIs', 'Team Leadership'] },
              ],
            },
            {
              id: 's4',
              variant: 'band',
              blocks: [
                { id: 'b9', type: 'heading', level: 2, text: 'Experience' },
                { id: 'b10', type: 'cards', items: [
                  { title: 'Senior Engineer — Acme Corp', body: '2022–Present. Led a team of 4 engineers building the core product.', href: '' },
                  { title: 'Engineer — Startup Inc', body: '2019–2022. Full-stack development, shipped 3 major features.', href: '' },
                  { title: 'Intern — Big Tech Co', body: '2018–2019. Built internal tooling used by 200+ employees.', href: '' },
                ]},
              ],
            },
            {
              id: 's5',
              variant: 'plain',
              blocks: [
                { id: 'b11', type: 'heading', level: 2, text: 'Get in Touch' },
                { id: 'b12', type: 'contact', email: 'your@email.com', phone: '+1 555 000 0000', note: 'Open to new opportunities and collaborations.' },
              ],
            },
          ],
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────── Creative Portfolio
  {
    id: 'portfolio',
    name: 'Creative Portfolio',
    description: 'Bold dark design for designers, artists, and creatives.',
    category: 'Creative',
    themeId: 'midnight',
    thumbnail: IMG('photo-1558618666-fcd25c85cd64'),
    plan: 'free',
    content: {
      version: 2,
      siteType: 'portfolio',
      theme: 'midnight',
      pages: [
        {
          id: 'p1',
          slug: '',
          title: 'Work',
          description: 'My creative portfolio',
          showInNav: true,
          sections: [
            {
              id: 's1',
              variant: 'hero',
              blocks: [
                { id: 'b1', type: 'heading', level: 1, text: 'Creative Work' },
                { id: 'b2', type: 'text', text: 'Photographer · Graphic Designer · Visual Storyteller' },
                { id: 'b3', type: 'button', label: 'View Projects', href: '#projects' },
              ],
            },
            {
              id: 's2',
              variant: 'plain',
              blocks: [
                { id: 'b4', type: 'heading', level: 2, text: 'Selected Work' },
                { id: 'b5', type: 'gallery', items: [
                  { src: IMG('photo-1558618666-fcd25c85cd64'), alt: 'Creative project 1', caption: 'Brand Identity' },
                  { src: IMG('photo-1561070791-2526d30994b5'), alt: 'Creative project 2', caption: 'Photography' },
                  { src: IMG('photo-1626785774573-4b799315345d'), alt: 'Creative project 3', caption: 'Digital Art' },
                  { src: IMG('photo-1547658719-da2b51169166'), alt: 'Creative project 4', caption: 'Web Design' },
                  { src: IMG('photo-1587440871875-191322ee64b0'), alt: 'Creative project 5', caption: 'Illustration' },
                  { src: IMG('photo-1618005198919-d3d4b5a92ead'), alt: 'Creative project 6', caption: 'Motion' },
                ]},
              ],
            },
            {
              id: 's3',
              variant: 'split',
              blocks: [
                { id: 'b6', type: 'image', src: IMG('photo-1507003211169-0a1dd7228f2d'), alt: 'About me' },
                { id: 'b7', type: 'heading', level: 2, text: 'About Me' },
                { id: 'b8', type: 'text', text: 'I create visual experiences that connect brands with their audiences. Based in New York, available worldwide.' },
                { id: 'b9', type: 'button', label: 'Work With Me', href: 'mailto:hello@example.com' },
              ],
            },
          ],
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────── Business / Services
  {
    id: 'business',
    name: 'Business Services',
    description: 'Professional services page with trust signals and CTA.',
    category: 'Business',
    themeId: 'ocean',
    thumbnail: IMG('photo-1542744173-8e7e53415bb0'),
    plan: 'free',
    content: {
      version: 2,
      siteType: 'business',
      theme: 'ocean',
      pages: [
        {
          id: 'p1',
          slug: '',
          title: 'Home',
          description: 'Professional business services',
          showInNav: true,
          sections: [
            {
              id: 's1',
              variant: 'hero',
              blocks: [
                { id: 'b1', type: 'heading', level: 1, text: 'Grow Your Business with Confidence' },
                { id: 'b2', type: 'text', text: 'We help businesses of all sizes build, scale, and succeed. Trusted by over 500 companies.' },
                { id: 'b3', type: 'button', label: 'Get a Free Consultation', href: 'mailto:hello@example.com' },
              ],
            },
            {
              id: 's2',
              variant: 'band',
              blocks: [
                { id: 'b4', type: 'stats', items: [
                  { label: 'Clients Served', value: '500+' },
                  { label: 'Years in Business', value: '12' },
                  { label: 'Success Rate', value: '98%' },
                ]},
              ],
            },
            {
              id: 's3',
              variant: 'plain',
              blocks: [
                { id: 'b5', type: 'heading', level: 2, text: 'Our Services' },
                { id: 'b6', type: 'cards', items: [
                  { title: 'Strategy Consulting', body: 'We work with your leadership team to define goals and build a roadmap for growth.', href: '' },
                  { title: 'Digital Marketing', body: 'Data-driven campaigns that attract the right customers and convert them.', href: '' },
                  { title: 'Operations & Systems', body: 'Streamline your processes so your team can focus on what matters most.', href: '' },
                ]},
              ],
            },
            {
              id: 's4',
              variant: 'plain',
              blocks: [
                { id: 'b7', type: 'quote', text: 'Working with this team transformed our business. Revenue grew 3x in the first year.', attribution: 'Jane Smith, CEO of TechCorp' },
              ],
            },
            {
              id: 's5',
              variant: 'plain',
              blocks: [
                { id: 'b8', type: 'heading', level: 2, text: 'Ready to Get Started?' },
                { id: 'b9', type: 'contact', email: 'hello@example.com', phone: '+1 555 000 0000', note: 'Contact us today for a free 30-minute consultation.' },
              ],
            },
          ],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────── Photography Studio
  {
    id: 'photography',
    name: 'Photography Studio',
    description: 'Image-first layout for photographers and visual artists.',
    category: 'Creative',
    themeId: 'warm',
    thumbnail: IMG('photo-1452587925148-ce544e77e70d'),
    plan: 'free',
    content: {
      version: 2,
      siteType: 'portfolio',
      theme: 'warm',
      pages: [
        {
          id: 'p1',
          slug: '',
          title: 'Portfolio',
          description: 'Photography portfolio',
          showInNav: true,
          sections: [
            {
              id: 's1',
              variant: 'hero',
              blocks: [
                { id: 'b1', type: 'heading', level: 1, text: 'Capturing Moments That Last Forever' },
                { id: 'b2', type: 'text', text: 'Portrait · Wedding · Lifestyle Photography' },
              ],
            },
            {
              id: 's2',
              variant: 'plain',
              blocks: [
                { id: 'b3', type: 'gallery', items: [
                  { src: IMG('photo-1452587925148-ce544e77e70d'), alt: 'Photography sample 1', caption: '' },
                  { src: IMG('photo-1516035069371-29a1b244cc32'), alt: 'Photography sample 2', caption: '' },
                  { src: IMG('photo-1542038784456-1ea8e935640e'), alt: 'Photography sample 3', caption: '' },
                  { src: IMG('photo-1502602898657-3e91760cbb34'), alt: 'Photography sample 4', caption: 'Paris' },
                  { src: IMG('photo-1465101162946-4377e57745c3'), alt: 'Photography sample 5', caption: '' },
                  { src: IMG('photo-1476514525535-07fb3b4ae5f1'), alt: 'Photography sample 6', caption: 'Travel' },
                ]},
              ],
            },
            {
              id: 's3',
              variant: 'split',
              blocks: [
                { id: 'b4', type: 'image', src: IMG('photo-1507003211169-0a1dd7228f2d'), alt: 'Photographer' },
                { id: 'b5', type: 'heading', level: 2, text: 'About the Photographer' },
                { id: 'b6', type: 'text', text: 'Based in San Francisco. Available for portrait, wedding, and event photography worldwide. Booked 6 months in advance.' },
                { id: 'b7', type: 'button', label: 'Book a Session', href: 'mailto:hello@example.com' },
              ],
            },
          ],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────── Consultant/Coach
  {
    id: 'coach',
    name: 'Coach & Consultant',
    description: 'Authority-building layout with testimonials and a clear CTA.',
    category: 'Services',
    themeId: 'forest',
    thumbnail: IMG('photo-1552664730-d307ca884978'),
    plan: 'free',
    content: {
      version: 2,
      siteType: 'services',
      theme: 'forest',
      pages: [
        {
          id: 'p1',
          slug: '',
          title: 'Home',
          description: 'Coaching and consulting services',
          showInNav: true,
          sections: [
            {
              id: 's1',
              variant: 'hero',
              blocks: [
                { id: 'b1', type: 'heading', level: 1, text: 'Unlock Your Full Potential' },
                { id: 'b2', type: 'text', text: 'Executive coach and business consultant helping leaders and teams achieve breakthrough results.' },
                { id: 'b3', type: 'button', label: 'Book a Discovery Call', href: 'mailto:hello@example.com' },
              ],
            },
            {
              id: 's2',
              variant: 'band',
              blocks: [
                { id: 'b4', type: 'stats', items: [
                  { label: 'Clients Coached', value: '300+' },
                  { label: 'Average Revenue Growth', value: '2.4×' },
                  { label: 'Satisfaction Rate', value: '99%' },
                ]},
              ],
            },
            {
              id: 's3',
              variant: 'plain',
              blocks: [
                { id: 'b5', type: 'heading', level: 2, text: 'How I Help' },
                { id: 'b6', type: 'cards', items: [
                  { title: '1:1 Executive Coaching', body: 'Weekly sessions focused on your leadership, clarity, and performance.', href: '' },
                  { title: 'Team Workshops', body: 'Half-day or full-day intensives that realign your team around shared goals.', href: '' },
                  { title: 'Business Strategy', body: '90-day sprints to identify growth levers and remove what is holding you back.', href: '' },
                ]},
              ],
            },
            {
              id: 's4',
              variant: 'plain',
              blocks: [
                { id: 'b7', type: 'quote', text: 'Three months in, I had more clarity, energy, and direction than I had in the previous three years.', attribution: 'Mark L., Founder & CEO' },
              ],
            },
            {
              id: 's5',
              variant: 'split',
              blocks: [
                { id: 'b8', type: 'image', src: IMG('photo-1552664730-d307ca884978'), alt: 'Coach' },
                { id: 'b9', type: 'heading', level: 2, text: 'About Me' },
                { id: 'b10', type: 'text', text: 'Former Fortune 500 executive turned coach. I have led teams across 6 countries and helped hundreds of leaders step into their best selves.' },
                { id: 'b11', type: 'button', label: 'Let\'s Talk', href: 'mailto:hello@example.com' },
              ],
            },
          ],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────── Restaurant/Food
  {
    id: 'restaurant',
    name: 'Restaurant & Food',
    description: 'Warm design for restaurants, cafes, and food businesses.',
    category: 'Business',
    themeId: 'coral',
    thumbnail: IMG('photo-1414235077428-338989a2e8c0'),
    plan: 'free',
    content: {
      version: 2,
      siteType: 'business',
      theme: 'coral',
      pages: [
        {
          id: 'p1',
          slug: '',
          title: 'Welcome',
          description: 'Our restaurant',
          showInNav: true,
          sections: [
            {
              id: 's1',
              variant: 'hero',
              blocks: [
                { id: 'b1', type: 'image', src: IMG('photo-1414235077428-338989a2e8c0'), alt: 'Our food' },
                { id: 'b2', type: 'heading', level: 1, text: 'Good Food, Great Company' },
                { id: 'b3', type: 'text', text: 'Fresh ingredients, family recipes, and a warm atmosphere you\'ll want to come back to.' },
                { id: 'b4', type: 'button', label: 'Make a Reservation', href: 'tel:+15550000000' },
              ],
            },
            {
              id: 's2',
              variant: 'plain',
              blocks: [
                { id: 'b5', type: 'heading', level: 2, text: 'Our Specialties' },
                { id: 'b6', type: 'gallery', items: [
                  { src: IMG('photo-1414235077428-338989a2e8c0'), alt: 'Dish 1', caption: 'Signature Pasta' },
                  { src: IMG('photo-1504674900247-0877df9cc836'), alt: 'Dish 2', caption: 'Fresh Catch' },
                  { src: IMG('photo-1565299624946-b28f40a0ae38'), alt: 'Dish 3', caption: 'Wood-fired Pizza' },
                  { src: IMG('photo-1540189549336-e6e99b931073'), alt: 'Dish 4', caption: 'Garden Salad' },
                ]},
              ],
            },
            {
              id: 's3',
              variant: 'band',
              blocks: [
                { id: 'b7', type: 'heading', level: 2, text: 'Visit Us' },
                { id: 'b8', type: 'contact', email: 'reservations@example.com', phone: '+1 555 000 0000', note: '123 Main Street · Open Tue–Sun, 5pm–10pm' },
              ],
            },
          ],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────── PRO templates ($12/mo)
  {
    id: 'freelancer',
    name: 'Freelancer',
    description: 'Services, rates, and a booking form for independent professionals.',
    category: 'Services',
    themeId: 'slate',
    plan: 'pro',
    thumbnail: IMG('photo-1488590528505-98d2b5aba04b'),
    content: {
      version: 2,
      siteType: 'services',
      theme: 'slate',
      pages: [
        {
          id: 'p1', slug: '', title: 'Home', description: 'Freelance services', showInNav: true,
          sections: [
            { id: 's1', variant: 'hero', blocks: [
              { id: 'b1', type: 'heading', level: 1, text: 'I Build Things for the Web' },
              { id: 'b2', type: 'text', text: 'Freelance developer and designer available for projects, contracts, and consulting.' },
              { id: 'b3', type: 'button', label: 'Work with Me', href: '#contact' },
            ]},
            { id: 's2', variant: 'plain', blocks: [
              { id: 'b4', type: 'heading', level: 2, text: 'What I Do' },
              { id: 'b5', type: 'cards', items: [
                { title: 'Web Development', body: 'Fast, responsive websites and web apps built to your spec.', href: '' },
                { title: 'UI/UX Design', body: 'Clean interfaces that convert — from wireframe to handoff.', href: '' },
                { title: 'Consulting', body: 'Strategy, audits, and technical direction for your team.', href: '' },
              ]},
            ]},
            { id: 's3', variant: 'band', blocks: [
              { id: 'b6', type: 'heading', level: 2, text: 'Rates' },
              { id: 'b7', type: 'stats', items: [
                { label: 'Hourly', value: '$120/hr' },
                { label: 'Day Rate', value: '$900/day' },
                { label: 'Project Min', value: '$2,500' },
              ]},
            ]},
            { id: 's4', variant: 'plain', blocks: [
              { id: 'b8', type: 'heading', level: 2, text: 'Let\'s Talk' },
              { id: 'b9', type: 'contact', email: 'hello@yourname.com', phone: '', note: 'Usually respond within 24 hours.' },
            ]},
          ],
        },
      ],
    },
  },
  {
    id: 'writer',
    name: 'Writer / Author',
    description: 'Books, articles, and a newsletter signup for writers and journalists.',
    category: 'Personal',
    themeId: 'warm',
    plan: 'pro',
    thumbnail: IMG('photo-1455390582262-044cdead277a'),
    content: {
      version: 2,
      siteType: 'blog',
      theme: 'warm',
      pages: [
        {
          id: 'p1', slug: '', title: 'Home', description: 'Writer portfolio', showInNav: true,
          sections: [
            { id: 's1', variant: 'hero', blocks: [
              { id: 'b1', type: 'heading', level: 1, text: 'Words That Move People' },
              { id: 'b2', type: 'text', text: 'Journalist · Author · Essayist. I write about culture, technology, and what it means to be human in a fast-moving world.' },
              { id: 'b3', type: 'button', label: 'Read My Work', href: '#writing' },
            ]},
            { id: 's2', variant: 'plain', blocks: [
              { id: 'b4', type: 'heading', level: 2, text: 'Books' },
              { id: 'b5', type: 'cards', items: [
                { title: 'The First Book', body: 'A short description of what the book is about and who it\'s for.', href: '#' },
                { title: 'The Second Book', body: 'Another title — themes, premise, and where to find it.', href: '#' },
              ]},
            ]},
            { id: 's3', variant: 'plain', blocks: [
              { id: 'b6', type: 'heading', level: 2, text: 'Recent Writing' },
              { id: 'b7', type: 'cards', items: [
                { title: 'Article Title One', body: 'Published in Publication Name · A one-line summary of the piece.', href: '#' },
                { title: 'Article Title Two', body: 'Published in Publication Name · A one-line summary of the piece.', href: '#' },
                { title: 'Article Title Three', body: 'Published in Publication Name · A one-line summary of the piece.', href: '#' },
              ]},
            ]},
            { id: 's4', variant: 'band', blocks: [
              { id: 'b8', type: 'heading', level: 2, text: 'Get in Touch' },
              { id: 'b9', type: 'contact', email: 'hello@yourname.com', phone: '', note: 'For commissions, interviews, and speaking enquiries.' },
            ]},
          ],
        },
      ],
    },
  },
  {
    id: 'startup',
    name: 'Startup Landing',
    description: 'Product hero, features, social proof, and a waitlist CTA.',
    category: 'Business',
    themeId: 'midnight',
    plan: 'pro',
    thumbnail: IMG('photo-1519389950473-47ba0277781c'),
    content: {
      version: 2,
      siteType: 'business',
      theme: 'midnight',
      pages: [
        {
          id: 'p1', slug: '', title: 'Home', description: 'Startup landing page', showInNav: true,
          sections: [
            { id: 's1', variant: 'hero', blocks: [
              { id: 'b1', type: 'heading', level: 1, text: 'The Smarter Way to [Do Thing]' },
              { id: 'b2', type: 'text', text: 'One sentence that describes the product and who it\'s for. Simple, specific, and outcome-focused.' },
              { id: 'b3', type: 'button', label: 'Join the Waitlist', href: '#waitlist' },
              { id: 'b4', type: 'button', label: 'See How It Works', href: '#how' },
            ]},
            { id: 's2', variant: 'plain', blocks: [
              { id: 'b5', type: 'heading', level: 2, text: 'Why It Works' },
              { id: 'b6', type: 'cards', items: [
                { title: '10× Faster', body: 'Cut the time it takes to do [task] from hours to minutes.', href: '' },
                { title: 'No Setup', body: 'Connect in one click. No configuration, no technical knowledge needed.', href: '' },
                { title: 'Always Improving', body: 'The more you use it, the better it gets — learns from your workflow.', href: '' },
              ]},
            ]},
            { id: 's3', variant: 'band', blocks: [
              { id: 'b7', type: 'heading', level: 2, text: 'Trusted by Teams at' },
              { id: 'b8', type: 'stats', items: [
                { label: 'Beta Users', value: '2,400+' },
                { label: 'Time Saved', value: '18 hrs/mo' },
                { label: 'Satisfaction', value: '4.9 / 5' },
              ]},
            ]},
            { id: 's4', variant: 'plain', blocks: [
              { id: 'b9', type: 'heading', level: 2, text: 'Get Early Access' },
              { id: 'b10', type: 'contact', email: 'hello@yourstartup.com', phone: '', note: 'Join the waitlist and we\'ll reach out when a spot opens up.' },
            ]},
          ],
        },
      ],
    },
  },
  {
    id: 'musician',
    name: 'Musician',
    description: 'Releases, tour dates, and booking for artists and bands.',
    category: 'Creative',
    themeId: 'graphite',
    plan: 'pro',
    thumbnail: IMG('photo-1511671782779-c97d3d27a1d4'),
    content: {
      version: 2,
      siteType: 'portfolio',
      theme: 'graphite',
      pages: [
        {
          id: 'p1', slug: '', title: 'Home', description: 'Artist page', showInNav: true,
          sections: [
            { id: 's1', variant: 'hero', blocks: [
              { id: 'b1', type: 'image', src: IMG('photo-1511671782779-c97d3d27a1d4'), alt: 'Artist photo' },
              { id: 'b2', type: 'heading', level: 1, text: 'Artist Name' },
              { id: 'b3', type: 'text', text: 'Singer · Songwriter · Producer' },
              { id: 'b4', type: 'button', label: 'Listen Now', href: '#' },
            ]},
            { id: 's2', variant: 'plain', blocks: [
              { id: 'b5', type: 'heading', level: 2, text: 'Latest Release' },
              { id: 'b6', type: 'cards', items: [
                { title: 'Album / EP Title', body: 'Released June 2026 · Available on Spotify, Apple Music, and all streaming platforms.', href: '#' },
              ]},
            ]},
            { id: 's3', variant: 'plain', blocks: [
              { id: 'b7', type: 'heading', level: 2, text: 'Tour Dates' },
              { id: 'b8', type: 'list', ordered: false, items: ['Jul 12 — Chicago, IL · Metro', 'Jul 19 — New York, NY · Bowery Ballroom', 'Aug 3 — Los Angeles, CA · The Troubadour'] },
            ]},
            { id: 's4', variant: 'band', blocks: [
              { id: 'b9', type: 'heading', level: 2, text: 'Booking & Press' },
              { id: 'b10', type: 'contact', email: 'booking@yourname.com', phone: '', note: 'For booking, press inquiries, and sync licensing.' },
            ]},
          ],
        },
      ],
    },
  },

  // ────────────────────────────────────────────── BUSINESS templates ($49/mo)
  {
    id: 'agency',
    name: 'Creative Agency',
    description: 'Full agency site with services, team, case studies, and new business form.',
    category: 'Business',
    themeId: 'obsidian',
    plan: 'business',
    thumbnail: IMG('photo-1542744173-8e7e53415bb0'),
    content: {
      version: 2,
      siteType: 'business',
      theme: 'obsidian',
      pages: [
        {
          id: 'p1', slug: '', title: 'Home', description: 'Agency homepage', showInNav: true,
          sections: [
            { id: 's1', variant: 'hero', blocks: [
              { id: 'b1', type: 'heading', level: 1, text: 'We Build Brands That Mean Something' },
              { id: 'b2', type: 'text', text: 'Strategy, design, and development for companies that want to stand out. Based everywhere. Working globally.' },
              { id: 'b3', type: 'button', label: 'Start a Project', href: '#contact' },
              { id: 'b4', type: 'button', label: 'Our Work', href: '#work' },
            ]},
            { id: 's2', variant: 'plain', blocks: [
              { id: 'b5', type: 'heading', level: 2, text: 'What We Do' },
              { id: 'b6', type: 'cards', items: [
                { title: 'Brand Strategy', body: 'Positioning, messaging, and identity that makes you impossible to ignore.', href: '' },
                { title: 'Design Systems', body: 'Scalable UI/UX that your team can build on for years.', href: '' },
                { title: 'Web & App Development', body: 'Production-grade builds, shipped fast, maintained properly.', href: '' },
                { title: 'Growth Marketing', body: 'Paid, organic, and content strategies tuned to your funnel.', href: '' },
              ]},
            ]},
            { id: 's3', variant: 'band', blocks: [
              { id: 'b7', type: 'heading', level: 2, text: 'By the Numbers' },
              { id: 'b8', type: 'stats', items: [
                { label: 'Projects Shipped', value: '140+' },
                { label: 'Years Operating', value: '8' },
                { label: 'Client Retention', value: '94%' },
              ]},
            ]},
            { id: 's4', variant: 'plain', blocks: [
              { id: 'b9', type: 'heading', level: 2, text: 'New Business' },
              { id: 'b10', type: 'contact', email: 'hello@agency.com', phone: '+1 555 000 0000', note: 'Tell us about your project and we\'ll be in touch within one business day.' },
            ]},
          ],
        },
      ],
    },
  },
  {
    id: 'developer',
    name: 'Developer Portfolio',
    description: 'Terminal-inspired dark portfolio for engineers and founders.',
    category: 'Personal',
    themeId: 'terminal',
    plan: 'business',
    thumbnail: IMG('photo-1555066931-4365d14bab8c'),
    content: {
      version: 2,
      siteType: 'portfolio',
      theme: 'terminal',
      pages: [
        {
          id: 'p1', slug: '', title: 'Home', description: 'Developer portfolio', showInNav: true,
          sections: [
            { id: 's1', variant: 'hero', blocks: [
              { id: 'b1', type: 'heading', level: 1, text: 'hi, i\'m [name]' },
              { id: 'b2', type: 'text', text: '[founder · engineer · builder] — I turn ideas into working products across fintech, AI, and developer tools.' },
              { id: 'b3', type: 'button', label: '→ see my work', href: '#projects' },
            ]},
            { id: 's2', variant: 'plain', blocks: [
              { id: 'b4', type: 'heading', level: 2, text: 'projects' },
              { id: 'b5', type: 'cards', items: [
                { title: 'Project One', body: 'What it does, who it\'s for, and the tech behind it.', href: '#' },
                { title: 'Project Two', body: 'What it does, who it\'s for, and the tech behind it.', href: '#' },
                { title: 'Project Three', body: 'What it does, who it\'s for, and the tech behind it.', href: '#' },
              ]},
            ]},
            { id: 's3', variant: 'plain', blocks: [
              { id: 'b6', type: 'heading', level: 2, text: 'stack' },
              { id: 'b7', type: 'list', ordered: false, items: ['TypeScript / React / Next.js', 'Python · FastAPI · Supabase', 'Docker · Cloudflare · Vercel', 'LLM integrations — Claude, GPT-4o'] },
            ]},
            { id: 's4', variant: 'band', blocks: [
              { id: 'b8', type: 'heading', level: 2, text: 'contact' },
              { id: 'b9', type: 'contact', email: 'you@example.com', phone: '', note: 'Open to interesting projects and conversations.' },
            ]},
          ],
        },
      ],
    },
  },
  {
    id: 'luxury-hotel',
    name: 'Boutique Hotel',
    description: 'Elegant property site with rooms, amenities, and a reservation CTA.',
    category: 'Business',
    themeId: 'paper',
    plan: 'business',
    thumbnail: IMG('photo-1566073771259-6a8506099945'),
    content: {
      version: 2,
      siteType: 'business',
      theme: 'paper',
      pages: [
        {
          id: 'p1', slug: '', title: 'Home', description: 'Hotel homepage', showInNav: true,
          sections: [
            { id: 's1', variant: 'hero', blocks: [
              { id: 'b1', type: 'image', src: IMG('photo-1566073771259-6a8506099945'), alt: 'Hotel exterior' },
              { id: 'b2', type: 'heading', level: 1, text: 'A Place to Arrive' },
              { id: 'b3', type: 'text', text: '24 rooms. No chain. A genuinely local experience in the heart of the city.' },
              { id: 'b4', type: 'button', label: 'Book a Room', href: 'tel:+15550000000' },
            ]},
            { id: 's2', variant: 'plain', blocks: [
              { id: 'b5', type: 'heading', level: 2, text: 'Rooms & Suites' },
              { id: 'b6', type: 'cards', items: [
                { title: 'Classic Room', body: 'Queen bed · city view · complimentary breakfast · from $180/night', href: '' },
                { title: 'Superior Suite', body: 'King bed · living area · rooftop access · from $320/night', href: '' },
                { title: 'Penthouse', body: 'Two bedrooms · private terrace · butler service · from $680/night', href: '' },
              ]},
            ]},
            { id: 's3', variant: 'band', blocks: [
              { id: 'b7', type: 'heading', level: 2, text: 'Amenities' },
              { id: 'b8', type: 'list', ordered: false, items: ['Rooftop pool & bar', 'In-house restaurant (dinner, Thu–Sun)', 'Complimentary breakfast daily', 'Concierge & local experiences', 'Valet parking available'] },
            ]},
            { id: 's4', variant: 'plain', blocks: [
              { id: 'b9', type: 'heading', level: 2, text: 'Reservations' },
              { id: 'b10', type: 'contact', email: 'reservations@hotel.com', phone: '+1 555 000 0000', note: 'Call or email for direct rates — always better than third-party sites.' },
            ]},
          ],
        },
      ],
    },
  },
  {
    id: 'saas',
    name: 'SaaS Product',
    description: 'Feature-rich SaaS landing with pricing tiers and social proof.',
    category: 'Business',
    themeId: 'aurora',
    plan: 'business',
    thumbnail: IMG('photo-1551288049-bebda4e38f71'),
    content: {
      version: 2,
      siteType: 'business',
      theme: 'aurora',
      pages: [
        {
          id: 'p1', slug: '', title: 'Home', description: 'SaaS landing page', showInNav: true,
          sections: [
            { id: 's1', variant: 'hero', blocks: [
              { id: 'b1', type: 'heading', level: 1, text: 'The Platform That [Specific Outcome]' },
              { id: 'b2', type: 'text', text: 'Built for [target user]. Replaces [old tool]. Integrates with everything you already use.' },
              { id: 'b3', type: 'button', label: 'Start Free Trial', href: '#' },
              { id: 'b4', type: 'button', label: 'See a Demo', href: '#' },
            ]},
            { id: 's2', variant: 'plain', blocks: [
              { id: 'b5', type: 'heading', level: 2, text: 'Everything You Need' },
              { id: 'b6', type: 'cards', items: [
                { title: 'Feature One', body: 'What it does and why it matters to your target user.', href: '' },
                { title: 'Feature Two', body: 'What it does and why it matters to your target user.', href: '' },
                { title: 'Feature Three', body: 'What it does and why it matters to your target user.', href: '' },
                { title: 'Feature Four', body: 'What it does and why it matters to your target user.', href: '' },
              ]},
            ]},
            { id: 's3', variant: 'band', blocks: [
              { id: 'b7', type: 'heading', level: 2, text: 'Trusted by Thousands' },
              { id: 'b8', type: 'stats', items: [
                { label: 'Active Users', value: '12,000+' },
                { label: 'Uptime', value: '99.99%' },
                { label: 'NPS Score', value: '72' },
              ]},
            ]},
            { id: 's4', variant: 'plain', blocks: [
              { id: 'b9', type: 'heading', level: 2, text: 'Pricing' },
              { id: 'b10', type: 'cards', items: [
                { title: 'Starter — Free', body: 'Up to 3 users. Core features. No credit card required.', href: '#' },
                { title: 'Pro — $29/mo', body: 'Unlimited users. Advanced features. Priority support.', href: '#' },
                { title: 'Enterprise', body: 'Custom pricing. SLA. Dedicated account manager.', href: '#' },
              ]},
            ]},
            { id: 's5', variant: 'plain', blocks: [
              { id: 'b11', type: 'heading', level: 2, text: 'Get Started' },
              { id: 'b12', type: 'contact', email: 'hello@yourproduct.com', phone: '', note: 'Questions about enterprise pricing or integrations? We\'re here.' },
            ]},
          ],
        },
      ],
    },
  },
]

export function templatesForPlan(plan: 'free' | 'pro' | 'business'): SiteTemplate[] {
  const order = { free: 0, pro: 1, business: 2 }
  return SITE_TEMPLATES.filter((t) => order[t.plan] <= order[plan])
}
