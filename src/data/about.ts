import type { Localized } from '../i18n/types'

export interface AboutFact {
  value: string
  label: Localized
}

/** Pull quote split around its accented word: `pre` + <em>`em`</em> + `post`. */
export const aboutQuote: { pre: Localized; em: Localized; post: Localized } = {
  pre: { en: 'Software engineer by trade, ', es: 'Ingeniero de software de profesión, ' },
  em: { en: 'builder', es: 'constructor' },
  post: { en: ' by nature.', es: ' por naturaleza.' },
}

export const aboutParagraphs: Localized[] = [
  {
    en: "I'm from Monterrey and based in Houston. I've shipped production systems for Disney, Royal Caribbean, United Airlines and OXXO, from polished Angular frontends to .NET and Node.js APIs, Oracle and SQL databases, Docker infrastructure and monitoring with Datadog and Sentry.",
    es: 'Soy de Monterrey y vivo en Houston. He llevado a producción sistemas para Disney, Royal Caribbean, United Airlines y OXXO, desde frontends Angular pulidos hasta APIs en .NET y Node.js, bases de datos Oracle y SQL, infraestructura con Docker y monitoreo con Datadog y Sentry.',
  },
  {
    en: 'These days I build with AI agents every day, inside a workflow I keep refining: specs first, guardrails around the agents, and my review on every change. I write about what works on the blog.',
    es: 'Hoy construyo con agentes de IA todos los días, dentro de un flujo que sigo afinando: primero las specs, límites para los agentes y mi revisión en cada cambio. Escribo sobre lo que funciona en el blog.',
  },
  {
    en: "Away from work I'm gaming, learning something new, or prototyping the next idea.",
    es: 'Fuera del trabajo juego, aprendo algo nuevo o prototipo la próxima idea.',
  },
]

/** The 7 global brands: Gannett, Disney, Royal Caribbean, Dick's Sporting Goods, United Airlines, OXXO, Globant. */
export const aboutFacts: AboutFact[] = [
  { value: '6', label: { en: 'years in production', es: 'años en producción' } },
  { value: '7', label: { en: 'global brands', es: 'marcas globales' } },
  { value: '20+', label: { en: 'tools in production', es: 'herramientas en producción' } },
]
