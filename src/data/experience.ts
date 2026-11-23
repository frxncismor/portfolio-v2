import type { Localized } from '../i18n/types'

export interface ExperienceEntry {
  /** Left-column label ("Now", "5 years"). */
  period: Localized
  company: string
  role: Localized
  description: Localized
  /** Plain-text client list shown under the description. */
  clients: string
}

export interface FreelanceEntry {
  name: string
  /** Short suffix after the name, e.g. "regiolabs.com.mx". */
  tagline: Localized
  description: Localized
  /** Only set when a real public URL exists: renders the ↗ link. */
  url?: string
  /** Accessible name of the ↗ link. */
  openLabel?: Localized
}

export const experience: ExperienceEntry[] = [
  {
    period: { en: 'Now', es: 'Ahora' },
    company: 'Valtre',
    role: { en: 'DevCrossQA · Backend Engineer', es: 'DevCrossQA · Ingeniero Backend' },
    description: {
      en: 'Building a .NET 10 API for OXXO with an AI-assisted workflow (GitHub Copilot, Claude, Codex): I own the backend code end to end, apply engineering best practices and test everything I ship to guarantee code and product quality.',
      es: 'Desarrollo una API con .NET 10 para OXXO con un flujo asistido por IA (GitHub Copilot, Claude, Codex): me encargo del código backend de principio a fin, aplico buenas prácticas de ingeniería y pruebo todo lo que entrego para asegurar la calidad del código y del producto.',
    },
    clients: 'OXXO',
  },
  {
    period: { en: '5 years', es: '5 años' },
    company: 'Globant',
    role: { en: 'Senior Software Engineer', es: 'Ingeniero de Software Senior' },
    description: {
      en: "Delivered production-grade frontends for global enterprise brands as part of Globant's engineering teams.",
      es: 'Entregué frontends de nivel producción para marcas enterprise globales como parte de los equipos de ingeniería de Globant.',
    },
    clients: "Disney, Royal Caribbean, United Airlines, Dick's Sporting Goods, Gannett",
  },
]

export const freelance: FreelanceEntry[] = [
  {
    name: 'RegioLabs',
    tagline: { en: 'regiolabs.com.mx', es: 'regiolabs.com.mx' },
    description: {
      en: 'Client project: I built the AI WhatsApp bots and the website for this automation studio in Monterrey, Mexico.',
      es: 'Proyecto para cliente: desarrollé los bots de WhatsApp con IA y el sitio web de este estudio de automatización de Monterrey, México.',
    },
    url: 'https://regiolabs.com.mx/',
    openLabel: { en: 'Open RegioLabs (opens in a new tab)', es: 'Abrir RegioLabs (se abre en una pestaña nueva)' },
  },
  {
    name: 'Caro Sweet MUA',
    tagline: { en: 'Brand & booking site', es: 'Marca y sitio de reservas' },
    description: {
      en: 'Brand and booking site for a professional makeup artist.',
      es: 'Sitio de marca y reservas para una maquillista profesional.',
    },
    url: 'https://caro-sweet-mua.vercel.app/',
    openLabel: { en: 'Open Caro Sweet MUA (opens in a new tab)', es: 'Abrir Caro Sweet MUA (se abre en una pestaña nueva)' },
  },
]
