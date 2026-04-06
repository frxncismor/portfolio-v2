export interface Template {
  id: string
  title: string
  category: string
  description: string
  features: string[]
  accentColor: string
  price: number
  url: string
}

export const templates: Template[] = [
  {
    id: 'zoo-nova-html',
    title: 'ZooNova — HTML + Tailwind CSS',
    category: 'HTML · Template',
    description:
      'A complete, production-ready HTML template for zoos and wildlife parks. Six fully designed pages built with pure HTML5 and Tailwind CSS via CDN — no build tools, no dependencies. Open the file in a browser and start customizing. Perfect for freelancers, agencies, or anyone delivering a static website fast.',
    features: ['HTML5', 'Tailwind CSS', 'CDN', '6 Pages', 'No build tools'],
    accentColor: '#3D9A5C',
    price: 25,
    url: 'https://frxncismor.gumroad.com/l/zoo-nova-html',
  },
]
