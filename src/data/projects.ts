export interface Project {
  id: string
  title: string
  category: string
  description: string
  stack: string[]
  accentColor: string
  url?: string
  githubUrl?: string
  wip?: boolean
}

export const projects: Project[] = [
  {
    id: 'shelfie',
    title: 'Shelfie',
    category: 'AI · SaaS',
    description:
      'AI SaaS that helps small businesses upgrade product photos using generative AI, with Stripe subscriptions and Supabase storage.',
    stack: ['React', 'TypeScript', 'Supabase', 'Stripe', 'Tailwind CSS'],
    accentColor: '#7F77DD',
    url: 'https://shelfie.com.mx/',
  },
  {
    id: 'nox-coffee',
    title: 'Nox Coffee',
    category: 'LANDING · MOTION',
    description:
      'Brand experience for a fictional late-night coffee company. Scroll-driven storytelling, pinned product showcase, and horizontal lineup section — all under 100KB of JavaScript. Desktop recommended for the full motion experience.',
    stack: ['Astro', 'TypeScript', 'GSAP', 'ScrollTrigger', 'Lenis', 'Tailwind CSS'],
    accentColor: '#A0713A',
    url: 'https://nox-coffee.vercel.app/',
    githubUrl: 'https://github.com/frxncismor/nox-coffee',
  },
  {
    id: 'room-tour',
    title: 'Room Tour & Descriptions',
    category: '3D · Interactive',
    description:
      'Interactive 3D room viewer with orbit controls, teleportation navigation and object interaction.',
    stack: ['Angular', 'TypeScript', 'Three.js', 'Angular Material'],
    accentColor: '#EF9F27',
    url: 'https://room-tour-and-descriptions.vercel.app/',
  },
  {
    id: 'crossy-road',
    title: 'Mega Basic Crossy Road',
    category: 'Game · For fun',
    description:
      'Browser-based 3D Crossy Road clone with collision detection and keyboard-controlled gameplay.',
    stack: ['TypeScript', 'Three.js', 'Vite'],
    accentColor: '#EF9F27',
    url: 'https://mega-basic-crossy-road.vercel.app/',
  },
  {
    id: 'caro-sweet-mua',
    title: 'Caro Sweet MUA',
    category: 'Beauty · Freelance',
    description:
      'Portfolio site for a professional makeup artist with before/after image sliders, filterable gallery, client testimonials, and Cal.com booking integration.',
    stack: ['Astro', 'TypeScript', 'Tailwind CSS', 'Cal.com'],
    accentColor: '#C0698A',
    url: 'https://caro-sweet-mua.vercel.app/',
    githubUrl: 'https://github.com/frxncismor/caro-sweet-mua',
  },
]
