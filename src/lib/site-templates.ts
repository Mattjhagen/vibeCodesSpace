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

  // ──────────────────────────────────────── Additional PRO templates ($12/mo)
  {
    id: 'real-estate',
    name: 'Real Estate Agent',
    description: 'Property listings, credentials, and a lead capture form for agents.',
    category: 'Business',
    themeId: 'slate',
    plan: 'pro',
    thumbnail: IMG('photo-1560518883-ce09059eeffa'),
    content: {
      version: 2, siteType: 'services', theme: 'slate',
      pages: [{
        id: 'p1', slug: '', title: 'Home', description: 'Real estate agent', showInNav: true,
        sections: [
          { id: 's1', variant: 'hero', blocks: [
            { id: 'b1', type: 'image', src: IMG('photo-1560518883-ce09059eeffa'), alt: 'Properties' },
            { id: 'b2', type: 'heading', level: 1, text: 'Find Your Dream Home' },
            { id: 'b3', type: 'text', text: 'Licensed real estate agent serving the greater metro area. Residential, commercial, and investment properties.' },
            { id: 'b4', type: 'button', label: 'Browse Listings', href: '#listings' },
          ]},
          { id: 's2', variant: 'plain', blocks: [
            { id: 'b5', type: 'heading', level: 2, text: 'Featured Listings' },
            { id: 'b6', type: 'cards', items: [
              { title: '4BR Colonial — $485,000', body: '4 bed · 2.5 bath · 2,400 sqft · Great school district · Offered at $485,000', href: '#' },
              { title: 'Downtown Condo — $295,000', body: '2 bed · 2 bath · 1,100 sqft · Rooftop access · City views · $295,000', href: '#' },
              { title: 'Investment Duplex — $380,000', body: '2 units · Fully leased · 7.2% cap rate · Recently renovated', href: '#' },
            ]},
          ]},
          { id: 's3', variant: 'band', blocks: [
            { id: 'b7', type: 'heading', level: 2, text: 'By the Numbers' },
            { id: 'b8', type: 'stats', items: [{ label: 'Homes Sold', value: '200+' }, { label: 'Avg Days on Market', value: '18' }, { label: 'Client Satisfaction', value: '4.9★' }] },
          ]},
          { id: 's4', variant: 'plain', blocks: [
            { id: 'b9', type: 'heading', level: 2, text: 'Let\'s Talk' },
            { id: 'b10', type: 'contact', email: 'agent@realty.com', phone: '+1 555 000 0000', note: 'Buying, selling, or investing — I\'m here to help.' },
          ]},
        ],
      }],
    },
  },
  {
    id: 'personal-trainer',
    name: 'Personal Trainer',
    description: 'Programs, testimonials, and booking for fitness coaches.',
    category: 'Services',
    themeId: 'coral',
    plan: 'pro',
    thumbnail: IMG('photo-1571019613454-1cb2f99b2d8b'),
    content: {
      version: 2, siteType: 'services', theme: 'coral',
      pages: [{
        id: 'p1', slug: '', title: 'Home', description: 'Personal trainer', showInNav: true,
        sections: [
          { id: 's1', variant: 'hero', blocks: [
            { id: 'b1', type: 'heading', level: 1, text: 'Train Smarter. Live Better.' },
            { id: 'b2', type: 'text', text: 'Certified personal trainer specializing in strength, fat loss, and athletic performance. Online and in-person coaching available.' },
            { id: 'b3', type: 'button', label: 'Book a Free Consult', href: '#contact' },
          ]},
          { id: 's2', variant: 'plain', blocks: [
            { id: 'b4', type: 'heading', level: 2, text: 'Programs' },
            { id: 'b5', type: 'cards', items: [
              { title: '1:1 Coaching', body: 'Fully personalized training and nutrition plan. Weekly check-ins. Starting at $250/mo.', href: '#' },
              { title: 'Group Training', body: 'Small group sessions (4–6 people). Build community and save. $80/mo.', href: '#' },
              { title: 'Online Program', body: '12-week self-paced program with video instruction. $149 one-time.', href: '#' },
            ]},
          ]},
          { id: 's3', variant: 'band', blocks: [
            { id: 'b6', type: 'heading', level: 2, text: 'Results' },
            { id: 'b7', type: 'stats', items: [{ label: 'Clients Trained', value: '300+' }, { label: 'Avg Weight Lost', value: '22 lbs' }, { label: 'Rating', value: '5.0★' }] },
          ]},
          { id: 's4', variant: 'plain', blocks: [
            { id: 'b8', type: 'heading', level: 2, text: 'Ready to Start?' },
            { id: 'b9', type: 'contact', email: 'coach@yourname.com', phone: '+1 555 000 0000', note: 'First consultation is always free.' },
          ]},
        ],
      }],
    },
  },
  {
    id: 'event-planner',
    name: 'Event Planner',
    description: 'Portfolio of events, services, and inquiry form for planners and coordinators.',
    category: 'Services',
    themeId: 'rose',
    plan: 'pro',
    thumbnail: IMG('photo-1511795409834-ef04bbd61622'),
    content: {
      version: 2, siteType: 'services', theme: 'rose',
      pages: [{
        id: 'p1', slug: '', title: 'Home', description: 'Event planner', showInNav: true,
        sections: [
          { id: 's1', variant: 'hero', blocks: [
            { id: 'b1', type: 'image', src: IMG('photo-1511795409834-ef04bbd61622'), alt: 'Event' },
            { id: 'b2', type: 'heading', level: 1, text: 'Events That Leave a Lasting Impression' },
            { id: 'b3', type: 'text', text: 'Full-service event planning for weddings, corporate events, and private celebrations. Every detail handled.' },
            { id: 'b4', type: 'button', label: 'Start Planning', href: '#contact' },
          ]},
          { id: 's2', variant: 'plain', blocks: [
            { id: 'b5', type: 'heading', level: 2, text: 'What We Plan' },
            { id: 'b6', type: 'cards', items: [
              { title: 'Weddings', body: 'Full-service and day-of coordination. Venue sourcing, vendors, florals, timeline — all taken care of.', href: '' },
              { title: 'Corporate Events', body: 'Conferences, retreats, product launches, and holiday parties. Seamless from start to finish.', href: '' },
              { title: 'Private Celebrations', body: 'Birthdays, anniversaries, graduations — made memorable with personal touches.', href: '' },
            ]},
          ]},
          { id: 's3', variant: 'plain', blocks: [
            { id: 'b7', type: 'heading', level: 2, text: 'Recent Events' },
            { id: 'b8', type: 'gallery', items: [
              { src: IMG('photo-1511795409834-ef04bbd61622'), alt: 'Wedding reception', caption: 'Garden Wedding · 180 guests' },
              { src: IMG('photo-1540575467537-35d8d1e7f1cd'), alt: 'Corporate event', caption: 'Annual Conference · Chicago' },
              { src: IMG('photo-1519225421980-715cb0215aed'), alt: 'Celebration', caption: 'Anniversary Gala · 50 guests' },
            ]},
          ]},
          { id: 's4', variant: 'band', blocks: [
            { id: 'b9', type: 'heading', level: 2, text: 'Get in Touch' },
            { id: 'b10', type: 'contact', email: 'hello@yourevents.com', phone: '+1 555 000 0000', note: 'Tell us about your event and we\'ll be in touch within 24 hours.' },
          ]},
        ],
      }],
    },
  },
  {
    id: 'consultant',
    name: 'Business Consultant',
    description: 'Expertise, case studies, and a discovery call CTA for independent consultants.',
    category: 'Business',
    themeId: 'graphite',
    plan: 'pro',
    thumbnail: IMG('photo-1600880292203-757bb62b4baf'),
    content: {
      version: 2, siteType: 'services', theme: 'graphite',
      pages: [{
        id: 'p1', slug: '', title: 'Home', description: 'Consultant', showInNav: true,
        sections: [
          { id: 's1', variant: 'hero', blocks: [
            { id: 'b1', type: 'heading', level: 1, text: 'Strategy That Moves the Needle' },
            { id: 'b2', type: 'text', text: 'Independent business consultant with 15 years of experience in operations, growth strategy, and organizational design. I work with founders and leadership teams who need clarity.' },
            { id: 'b3', type: 'button', label: 'Book a Discovery Call', href: '#contact' },
          ]},
          { id: 's2', variant: 'plain', blocks: [
            { id: 'b4', type: 'heading', level: 2, text: 'How I Help' },
            { id: 'b5', type: 'cards', items: [
              { title: 'Growth Strategy', body: 'Market analysis, pricing optimization, and go-to-market planning for scaling businesses.', href: '' },
              { title: 'Operations', body: 'Process audits, team structure, and system design to remove friction and increase throughput.', href: '' },
              { title: 'Leadership Advisory', body: 'Fractional COO and ongoing advisory for founders navigating scale.', href: '' },
            ]},
          ]},
          { id: 's3', variant: 'band', blocks: [
            { id: 'b6', type: 'heading', level: 2, text: 'Track Record' },
            { id: 'b7', type: 'stats', items: [{ label: 'Companies Advised', value: '60+' }, { label: 'Avg Revenue Increase', value: '34%' }, { label: 'Years Experience', value: '15' }] },
          ]},
          { id: 's4', variant: 'plain', blocks: [
            { id: 'b8', type: 'heading', level: 2, text: 'Work with Me' },
            { id: 'b9', type: 'contact', email: 'hello@yourname.com', phone: '', note: 'I take on a limited number of clients at a time. Book a 30-minute discovery call to see if we\'re a fit.' },
          ]},
        ],
      }],
    },
  },
  {
    id: 'podcast',
    name: 'Podcast',
    description: 'Show page with episodes, guests, and subscribe links for podcasters.',
    category: 'Creative',
    themeId: 'midnight',
    plan: 'pro',
    thumbnail: IMG('photo-1478737270239-2f02b77fc618'),
    content: {
      version: 2, siteType: 'blog', theme: 'midnight',
      pages: [{
        id: 'p1', slug: '', title: 'Home', description: 'Podcast', showInNav: true,
        sections: [
          { id: 's1', variant: 'hero', blocks: [
            { id: 'b1', type: 'heading', level: 1, text: 'The [Show Name] Podcast' },
            { id: 'b2', type: 'text', text: 'Weekly conversations with founders, operators, and creatives about what it actually takes to build something worth building.' },
            { id: 'b3', type: 'button', label: 'Listen on Spotify', href: '#' },
            { id: 'b4', type: 'button', label: 'Apple Podcasts', href: '#' },
          ]},
          { id: 's2', variant: 'plain', blocks: [
            { id: 'b5', type: 'heading', level: 2, text: 'Latest Episodes' },
            { id: 'b6', type: 'cards', items: [
              { title: 'Ep. 42 — Building in Public', body: 'How transparency became a competitive advantage for one founder\'s 7-figure bootstrapped business.', href: '#' },
              { title: 'Ep. 41 — Saying No to VC', body: 'Why this CEO turned down $4M and what happened next.', href: '#' },
              { title: 'Ep. 40 — The Pivot', body: 'From failed SaaS to profitable agency in 90 days.', href: '#' },
            ]},
          ]},
          { id: 's3', variant: 'band', blocks: [
            { id: 'b7', type: 'heading', level: 2, text: 'By the Numbers' },
            { id: 'b8', type: 'stats', items: [{ label: 'Episodes', value: '42' }, { label: 'Monthly Listeners', value: '12K' }, { label: 'Countries', value: '38' }] },
          ]},
          { id: 's4', variant: 'plain', blocks: [
            { id: 'b9', type: 'heading', level: 2, text: 'Be a Guest' },
            { id: 'b10', type: 'contact', email: 'hello@yourshow.com', phone: '', note: 'We\'re always looking for interesting founders and operators. Tell us your story.' },
          ]},
        ],
      }],
    },
  },
  {
    id: 'nonprofit',
    name: 'Nonprofit / Cause',
    description: 'Mission-driven site with impact stats, programs, and a donation CTA.',
    category: 'Business',
    themeId: 'forest',
    plan: 'pro',
    thumbnail: IMG('photo-1532629345422-7515f3d16bb6'),
    content: {
      version: 2, siteType: 'business', theme: 'forest',
      pages: [{
        id: 'p1', slug: '', title: 'Home', description: 'Nonprofit', showInNav: true,
        sections: [
          { id: 's1', variant: 'hero', blocks: [
            { id: 'b1', type: 'image', src: IMG('photo-1532629345422-7515f3d16bb6'), alt: 'Our mission' },
            { id: 'b2', type: 'heading', level: 1, text: 'Every Child Deserves a Chance' },
            { id: 'b3', type: 'text', text: 'We provide education, mentorship, and resources to underserved youth in communities across the country.' },
            { id: 'b4', type: 'button', label: 'Donate Now', href: '#donate' },
            { id: 'b5', type: 'button', label: 'Our Programs', href: '#programs' },
          ]},
          { id: 's2', variant: 'plain', blocks: [
            { id: 'b6', type: 'heading', level: 2, text: 'What We Do' },
            { id: 'b7', type: 'cards', items: [
              { title: 'After-School Tutoring', body: 'Free academic support in math, reading, and science for K-12 students.', href: '' },
              { title: 'Mentorship Program', body: 'Pairing youth with professional mentors for career guidance and life skills.', href: '' },
              { title: 'Summer Camps', body: 'Week-long STEM and arts camps at no cost to qualifying families.', href: '' },
            ]},
          ]},
          { id: 's3', variant: 'band', blocks: [
            { id: 'b8', type: 'heading', level: 2, text: 'Our Impact' },
            { id: 'b9', type: 'stats', items: [{ label: 'Students Served', value: '4,200' }, { label: 'Communities', value: '12' }, { label: 'Years Operating', value: '9' }] },
          ]},
          { id: 's4', variant: 'plain', blocks: [
            { id: 'b10', type: 'heading', level: 2, text: 'Get Involved' },
            { id: 'b11', type: 'contact', email: 'hello@yourorg.org', phone: '+1 555 000 0000', note: 'Whether you want to donate, volunteer, or partner with us — we\'d love to hear from you.' },
          ]},
        ],
      }],
    },
  },

  // ─────────────────────────────── Additional BUSINESS templates ($49/mo)
  {
    id: 'law-firm',
    name: 'Law Firm',
    description: 'Practice areas, attorney profiles, and consultation booking for legal professionals.',
    category: 'Business',
    themeId: 'paper',
    plan: 'business',
    thumbnail: IMG('photo-1589829545856-d10d557cf95f'),
    content: {
      version: 2, siteType: 'business', theme: 'paper',
      pages: [{
        id: 'p1', slug: '', title: 'Home', description: 'Law firm', showInNav: true,
        sections: [
          { id: 's1', variant: 'hero', blocks: [
            { id: 'b1', type: 'heading', level: 1, text: 'Trusted Legal Counsel Since 1998' },
            { id: 'b2', type: 'text', text: 'Experienced attorneys providing personalized legal services in business law, estate planning, real estate, and litigation.' },
            { id: 'b3', type: 'button', label: 'Schedule a Consultation', href: '#contact' },
          ]},
          { id: 's2', variant: 'plain', blocks: [
            { id: 'b4', type: 'heading', level: 2, text: 'Practice Areas' },
            { id: 'b5', type: 'cards', items: [
              { title: 'Business Law', body: 'Entity formation, contracts, mergers and acquisitions, and ongoing business counsel.', href: '' },
              { title: 'Estate Planning', body: 'Wills, trusts, powers of attorney, and probate administration.', href: '' },
              { title: 'Real Estate', body: 'Residential and commercial transactions, title review, and dispute resolution.', href: '' },
              { title: 'Litigation', body: 'Civil and commercial dispute resolution, negotiation, and courtroom representation.', href: '' },
            ]},
          ]},
          { id: 's3', variant: 'band', blocks: [
            { id: 'b6', type: 'heading', level: 2, text: 'Our Record' },
            { id: 'b7', type: 'stats', items: [{ label: 'Years in Practice', value: '25+' }, { label: 'Cases Handled', value: '3,000+' }, { label: 'Client Rating', value: '4.9★' }] },
          ]},
          { id: 's4', variant: 'plain', blocks: [
            { id: 'b8', type: 'heading', level: 2, text: 'Schedule a Consultation' },
            { id: 'b9', type: 'contact', email: 'info@lawfirm.com', phone: '+1 555 000 0000', note: 'Initial consultations are confidential and available by phone or in-person.' },
          ]},
        ],
      }],
    },
  },
  {
    id: 'medical-practice',
    name: 'Medical Practice',
    description: 'Clean, trustworthy site for doctors, dentists, and healthcare providers.',
    category: 'Business',
    themeId: 'ocean',
    plan: 'business',
    thumbnail: IMG('photo-1612349317150-e413f6a5b16d'),
    content: {
      version: 2, siteType: 'business', theme: 'ocean',
      pages: [{
        id: 'p1', slug: '', title: 'Home', description: 'Medical practice', showInNav: true,
        sections: [
          { id: 's1', variant: 'hero', blocks: [
            { id: 'b1', type: 'heading', level: 1, text: 'Compassionate Care, Close to Home' },
            { id: 'b2', type: 'text', text: 'Board-certified physicians providing comprehensive primary care for patients of all ages. Accepting new patients.' },
            { id: 'b3', type: 'button', label: 'Book an Appointment', href: '#contact' },
            { id: 'b4', type: 'button', label: 'Patient Portal', href: '#' },
          ]},
          { id: 's2', variant: 'plain', blocks: [
            { id: 'b5', type: 'heading', level: 2, text: 'Our Services' },
            { id: 'b6', type: 'cards', items: [
              { title: 'Primary Care', body: 'Annual physicals, chronic disease management, and preventive care for the whole family.', href: '' },
              { title: 'Urgent Care', body: 'Same-day appointments for minor injuries and acute illnesses — no ER wait.', href: '' },
              { title: 'Telehealth', body: 'Virtual visits from the comfort of your home. Available Mon–Fri.', href: '' },
              { title: 'Pediatrics', body: 'Well-child visits, vaccinations, and developmental screenings from birth to 18.', href: '' },
            ]},
          ]},
          { id: 's3', variant: 'band', blocks: [
            { id: 'b7', type: 'heading', level: 2, text: 'Why Patients Choose Us' },
            { id: 'b8', type: 'stats', items: [{ label: 'Patients Served', value: '8,000+' }, { label: 'Years in Practice', value: '18' }, { label: 'Patient Satisfaction', value: '97%' }] },
          ]},
          { id: 's4', variant: 'plain', blocks: [
            { id: 'b9', type: 'heading', level: 2, text: 'Book an Appointment' },
            { id: 'b10', type: 'contact', email: 'appointments@practice.com', phone: '+1 555 000 0000', note: 'Same-day appointments available. Most insurance plans accepted.' },
          ]},
        ],
      }],
    },
  },
  {
    id: 'architecture',
    name: 'Architecture Studio',
    description: 'Portfolio and services for architects, interior designers, and studios.',
    category: 'Creative',
    themeId: 'terminal',
    plan: 'business',
    thumbnail: IMG('photo-1486325212027-8081e485255e'),
    content: {
      version: 2, siteType: 'portfolio', theme: 'terminal',
      pages: [{
        id: 'p1', slug: '', title: 'Home', description: 'Architecture studio', showInNav: true,
        sections: [
          { id: 's1', variant: 'hero', blocks: [
            { id: 'b1', type: 'heading', level: 1, text: 'Space as a Statement' },
            { id: 'b2', type: 'text', text: 'Architecture and interior design studio. Residential, commercial, and hospitality projects. We design spaces people remember.' },
            { id: 'b3', type: 'button', label: 'View Our Work', href: '#work' },
          ]},
          { id: 's2', variant: 'plain', blocks: [
            { id: 'b4', type: 'heading', level: 2, text: 'Selected Projects' },
            { id: 'b5', type: 'gallery', items: [
              { src: IMG('photo-1486325212027-8081e485255e'), alt: 'Modern residence', caption: 'Lake House Residence · 2025' },
              { src: IMG('photo-1600585154340-be6161a56a0c'), alt: 'Interior', caption: 'Downtown Penthouse · 2024' },
              { src: IMG('photo-1497366216548-37526070297c'), alt: 'Office', caption: 'Tech Campus HQ · 2024' },
              { src: IMG('photo-1524758631624-e2822e304c36'), alt: 'Hospitality', caption: 'Boutique Hotel Lobby · 2023' },
            ]},
          ]},
          { id: 's3', variant: 'band', blocks: [
            { id: 'b6', type: 'heading', level: 2, text: 'Studio' },
            { id: 'b7', type: 'stats', items: [{ label: 'Projects Completed', value: '85' }, { label: 'Awards', value: '12' }, { label: 'Countries', value: '6' }] },
          ]},
          { id: 's4', variant: 'plain', blocks: [
            { id: 'b8', type: 'heading', level: 2, text: 'Start a Project' },
            { id: 'b9', type: 'contact', email: 'studio@yourname.com', phone: '+1 555 000 0000', note: 'We take on a limited number of projects each year. Reach out early.' },
          ]},
        ],
      }],
    },
  },
  {
    id: 'fintech',
    name: 'Fintech / Finance App',
    description: 'High-trust landing page for financial products, apps, and investment platforms.',
    category: 'Business',
    themeId: 'aurora',
    plan: 'business',
    thumbnail: IMG('photo-1611974789855-9c2a0a7236a3'),
    content: {
      version: 2, siteType: 'business', theme: 'aurora',
      pages: [{
        id: 'p1', slug: '', title: 'Home', description: 'Fintech landing', showInNav: true,
        sections: [
          { id: 's1', variant: 'hero', blocks: [
            { id: 'b1', type: 'heading', level: 1, text: 'Your Money, Working Harder' },
            { id: 'b2', type: 'text', text: 'Automated investing, real-time portfolio tracking, and AI-powered insights — all in one app. Join 50,000+ investors building wealth on autopilot.' },
            { id: 'b3', type: 'button', label: 'Get Started Free', href: '#' },
            { id: 'b4', type: 'button', label: 'See How It Works', href: '#how' },
          ]},
          { id: 's2', variant: 'plain', blocks: [
            { id: 'b5', type: 'heading', level: 2, text: 'Built for Serious Investors' },
            { id: 'b6', type: 'cards', items: [
              { title: 'Auto-Invest', body: 'Set rules once. We rebalance, reinvest dividends, and optimize your allocations automatically.', href: '' },
              { title: 'Tax Optimization', body: 'Tax-loss harvesting and smart asset location to keep more of what you earn.', href: '' },
              { title: 'Real-Time Analytics', body: 'Track performance, risk exposure, and projections across all your accounts in one dashboard.', href: '' },
              { title: 'Fractional Shares', body: 'Invest in any stock or ETF from $1. No minimums, no lock-ins.', href: '' },
            ]},
          ]},
          { id: 's3', variant: 'band', blocks: [
            { id: 'b7', type: 'heading', level: 2, text: 'Trusted by Investors' },
            { id: 'b8', type: 'stats', items: [{ label: 'Active Users', value: '50,000+' }, { label: 'Assets Managed', value: '$2.1B' }, { label: 'Avg Annual Return', value: '11.4%' }] },
          ]},
          { id: 's4', variant: 'plain', blocks: [
            { id: 'b9', type: 'heading', level: 2, text: 'Start Building Wealth' },
            { id: 'b10', type: 'contact', email: 'hello@yourapp.com', phone: '', note: 'Questions about security, fees, or how it works? We\'re here.' },
          ]},
        ],
      }],
    },
  },
]

export function templatesForPlan(plan: 'free' | 'pro' | 'business'): SiteTemplate[] {
  const order = { free: 0, pro: 1, business: 2 }
  return SITE_TEMPLATES.filter((t) => order[t.plan] <= order[plan])
}
