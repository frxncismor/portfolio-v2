import type { Localized } from '../i18n/types'

export interface Template {
  id: string
  name: string
  tag: Localized
  description: Localized
  price: number
  url: string
}

export const templates: Template[] = [
  {
    id: 'zoo-nova-html',
    name: 'ZooNova',
    tag: { en: 'HTML · Tailwind CSS · 6 pages', es: 'HTML · Tailwind CSS · 6 páginas' },
    description: {
      en: 'A complete template for zoos and wildlife parks. Six designed pages in plain HTML5 and Tailwind via CDN. Open the file and start customizing.',
      es: 'Una plantilla completa para zoológicos y parques de vida silvestre. Seis páginas diseñadas en HTML5 puro y Tailwind por CDN. Abre el archivo y empieza a personalizar.',
    },
    price: 25,
    url: 'https://frxncismor.gumroad.com/l/zoo-nova-html',
  },
]
