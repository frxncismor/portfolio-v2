/** Site-wide facts used by several components (contact, footer, nav, JSON-LD). Edit here only. */

export const email = 'frxncismor@gmail.com'

export interface SocialLink {
  /** Used to build the i18n keys (`contact.<id>`, `footer.<id>`). */
  id: 'github' | 'linkedin'
  label: string
  href: string
}

export const social: SocialLink[] = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/frxncismor' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com/in/frxncismor' },
]

export interface NavItem {
  /** i18n key suffix: `nav.<id>`. */
  id: 'work' | 'experience' | 'blog' | 'contact'
  label: string
  href: string
}

export const nav: NavItem[] = [
  { id: 'work', label: 'Work', href: '/#work' },
  { id: 'experience', label: 'Experience', href: '/#experience' },
  { id: 'blog', label: 'Blog', href: '/blog' },
  { id: 'contact', label: 'Contact', href: '/#contact' },
]

/** "Shipped for" row: the 6 enterprise brands plus RegioLabs (freelance client). */
export const clients = ['Disney', 'Royal Caribbean', 'United Airlines', 'OXXO', "Dick's Sporting Goods", 'Gannett', 'RegioLabs']
