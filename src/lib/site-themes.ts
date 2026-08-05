/**
 * Visual themes: CSS custom-property overrides applied to the site wrapper.
 * Because these are set as inline style on a div that contains all site content,
 * they cascade to every Tailwind utility that reads --background, --foreground, etc.
 */

export interface SiteTheme {
  id: string
  name: string
  description: string
  palette: [string, string, string, string] // bg, fg, primary, accent — for swatches
  vars: Record<string, string>
}

export const SITE_THEMES: SiteTheme[] = [
  {
    id: 'clean',
    name: 'Clean White',
    description: 'Simple and timeless',
    palette: ['#ffffff', '#111111', '#111111', '#f5f5f5'],
    vars: {
      '--background': '#ffffff',
      '--foreground': '#111111',
      '--card': '#ffffff',
      '--card-foreground': '#111111',
      '--primary': '#111111',
      '--primary-foreground': '#ffffff',
      '--secondary': '#f5f5f5',
      '--secondary-foreground': '#111111',
      '--muted': '#f5f5f5',
      '--muted-foreground': '#6b7280',
      '--border': '#e5e7eb',
      '--input': '#e5e7eb',
      '--radius': '0.5rem',
    },
  },
  {
    id: 'warm',
    name: 'Warm Linen',
    description: 'Cozy and personal',
    palette: ['#FAF7F2', '#2C1A0E', '#7C4D2E', '#EDE0D0'],
    vars: {
      '--background': '#FAF7F2',
      '--foreground': '#2C1A0E',
      '--card': '#FFF8F0',
      '--card-foreground': '#2C1A0E',
      '--primary': '#7C4D2E',
      '--primary-foreground': '#FAF7F2',
      '--secondary': '#EDE0D0',
      '--secondary-foreground': '#2C1A0E',
      '--muted': '#EDE0D0',
      '--muted-foreground': '#8B6E54',
      '--border': '#DDD0C0',
      '--input': '#DDD0C0',
      '--radius': '0.25rem',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Professional and trustworthy',
    palette: ['#F0F7FF', '#0A1628', '#0369A1', '#BAE6FD'],
    vars: {
      '--background': '#F0F7FF',
      '--foreground': '#0A1628',
      '--card': '#ffffff',
      '--card-foreground': '#0A1628',
      '--primary': '#0369A1',
      '--primary-foreground': '#ffffff',
      '--secondary': '#BAE6FD',
      '--secondary-foreground': '#0A1628',
      '--muted': '#E0F0FF',
      '--muted-foreground': '#475569',
      '--border': '#BAE6FD',
      '--input': '#BAE6FD',
      '--radius': '0.75rem',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural and grounded',
    palette: ['#F4F7F0', '#1A2E1A', '#166534', '#BBF7D0'],
    vars: {
      '--background': '#F4F7F0',
      '--foreground': '#1A2E1A',
      '--card': '#FAFFF8',
      '--card-foreground': '#1A2E1A',
      '--primary': '#166534',
      '--primary-foreground': '#F4F7F0',
      '--secondary': '#BBF7D0',
      '--secondary-foreground': '#1A2E1A',
      '--muted': '#DCFCE7',
      '--muted-foreground': '#4B6E4E',
      '--border': '#A7F3D0',
      '--input': '#A7F3D0',
      '--radius': '0.5rem',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark, bold, striking',
    palette: ['#0F0F13', '#FAFAFA', '#7C3AED', '#1E1B4B'],
    vars: {
      '--background': '#0F0F13',
      '--foreground': '#FAFAFA',
      '--card': '#1A1A22',
      '--card-foreground': '#FAFAFA',
      '--primary': '#7C3AED',
      '--primary-foreground': '#FAFAFA',
      '--secondary': '#1E1B4B',
      '--secondary-foreground': '#FAFAFA',
      '--muted': '#1E1E2A',
      '--muted-foreground': '#A1A1AA',
      '--border': '#2D2D3D',
      '--input': '#2D2D3D',
      '--radius': '0.75rem',
    },
  },
  {
    id: 'coral',
    name: 'Coral Sunset',
    description: 'Warm and energetic',
    palette: ['#FFF8F6', '#1A1A1A', '#E54D2E', '#FFEDD5'],
    vars: {
      '--background': '#FFF8F6',
      '--foreground': '#1A1A1A',
      '--card': '#ffffff',
      '--card-foreground': '#1A1A1A',
      '--primary': '#E54D2E',
      '--primary-foreground': '#ffffff',
      '--secondary': '#FFEDD5',
      '--secondary-foreground': '#1A1A1A',
      '--muted': '#FEF3C7',
      '--muted-foreground': '#78716C',
      '--border': '#FED7AA',
      '--input': '#FED7AA',
      '--radius': '1rem',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Modern and corporate',
    palette: ['#F1F5F9', '#0F172A', '#3B82F6', '#E2E8F0'],
    vars: {
      '--background': '#F1F5F9',
      '--foreground': '#0F172A',
      '--card': '#ffffff',
      '--card-foreground': '#0F172A',
      '--primary': '#3B82F6',
      '--primary-foreground': '#ffffff',
      '--secondary': '#E2E8F0',
      '--secondary-foreground': '#0F172A',
      '--muted': '#E2E8F0',
      '--muted-foreground': '#64748B',
      '--border': '#CBD5E1',
      '--input': '#CBD5E1',
      '--radius': '0.5rem',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Elegant and refined',
    palette: ['#FFF1F3', '#1A0A0F', '#E11D48', '#FFE4E6'],
    vars: {
      '--background': '#FFF1F3',
      '--foreground': '#1A0A0F',
      '--card': '#ffffff',
      '--card-foreground': '#1A0A0F',
      '--primary': '#E11D48',
      '--primary-foreground': '#ffffff',
      '--secondary': '#FFE4E6',
      '--secondary-foreground': '#1A0A0F',
      '--muted': '#FFE4E6',
      '--muted-foreground': '#9F1239',
      '--border': '#FECDD3',
      '--input': '#FECDD3',
      '--radius': '0.75rem',
    },
  },
]

export function findTheme(id: string): SiteTheme {
  return SITE_THEMES.find((t) => t.id === id) ?? SITE_THEMES[0]
}

/** CSS vars as an inline-style-compatible React object. */
export function themeInlineStyle(themeId: string): Record<string, string> {
  return findTheme(themeId).vars
}
