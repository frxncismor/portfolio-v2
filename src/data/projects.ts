import type { Localized } from '../i18n/types'

export type ProjectId = 'grim-builds' | 'devdeck' | 'nox-coffee' | 'room-tour' | 'crossy-road'

export interface Project {
  id: ProjectId
  title: string
  category: Localized
  description: Localized
  stack: string[]
  url?: string
  githubUrl?: string
  wip?: boolean
}

export const projects: Project[] = [
  {
    id: 'grim-builds',
    title: 'Grim Builds',
    category: { en: 'Full-stack · Platform', es: 'Full-stack · Plataforma' },
    description: {
      en: 'Build-guide platform for Grim Dawn: skills, devotions, gear, loot filters and a tier list with verifiable editorial provenance. pnpm monorepo with an Angular 21 SSR frontend, a Fastify + Drizzle API over PostgreSQL, a shared Zod domain, hardened Docker setup and CI with property-based, e2e, accessibility and Lighthouse checks.',
      es: 'Plataforma de guías de builds para Grim Dawn: habilidades, devociones, equipo, filtros de botín y tier list con procedencia editorial verificable. Monorepo pnpm con frontend Angular 21 con SSR, API Fastify + Drizzle sobre PostgreSQL, dominio compartido con Zod, Docker endurecido y CI con pruebas de propiedades, e2e, accesibilidad y Lighthouse.',
    },
    stack: ['Angular 21', 'Fastify', 'PostgreSQL', 'Drizzle', 'Zod', 'Docker'],
    githubUrl: 'https://github.com/frxncismor/grim-dawn-builds',
    wip: true,
  },
  {
    id: 'devdeck',
    title: 'DevDeck',
    category: { en: 'Desktop · Developer tools', es: 'Escritorio · Herramientas para devs' },
    description: {
      en: 'Lightweight desktop companion for developers juggling many repos and git worktrees. Four tools in one sidebar: worktree status with one-click open or remove, listening ports mapped to processes and worktrees, a streaming JSON viewer for files of hundreds of MB, and a Hidden Costs scan for forgotten worktrees and regenerable folders. Every cleanup asks first. Tauri 2, Rust and Svelte, with EN/ES UI.',
      es: 'Compañero de escritorio ligero para devs que manejan muchos repos y git worktrees. Cuatro herramientas en una barra lateral: estado de worktrees con abrir o eliminar en un clic, puertos en escucha ligados a procesos y worktrees, visor JSON en streaming para archivos de cientos de MB y un escaneo de costos ocultos con worktrees olvidados y carpetas regenerables. Toda limpieza pide confirmación. Tauri 2, Rust y Svelte, con interfaz EN/ES.',
    },
    stack: ['Tauri 2', 'Rust', 'Svelte', 'TypeScript'],
    githubUrl: 'https://github.com/frxncismor/devdeck',
    wip: true,
  },
  {
    id: 'nox-coffee',
    title: 'Nox Coffee',
    category: { en: 'Landing · Motion', es: 'Landing · Movimiento' },
    description: {
      en: 'Brand experience for a fictional late-night coffee company. Scroll-driven storytelling, pinned product showcase, and horizontal lineup section — all under 100KB of JavaScript. Desktop recommended for the full motion experience.',
      es: 'Experiencia de marca para una compañía ficticia de café nocturno. Storytelling guiado por scroll, showcase de producto fijo y sección horizontal de lineup — todo bajo 100KB de JavaScript. Se recomienda desktop para la experiencia completa de animaciones.',
    },
    stack: ['Astro', 'TypeScript', 'GSAP', 'ScrollTrigger', 'Lenis', 'Tailwind CSS'],
    url: 'https://nox-coffee.vercel.app/',
    githubUrl: 'https://github.com/frxncismor/nox-coffee',
  },
  {
    id: 'room-tour',
    title: 'Room Tour & Descriptions',
    category: { en: '3D · Interactive', es: '3D · Interactivo' },
    description: {
      en: 'Interactive 3D room viewer with orbit controls, teleportation navigation and object interaction.',
      es: 'Visor 3D interactivo de una habitación con controles orbitales, navegación por teletransporte e interacción con objetos.',
    },
    stack: ['Angular', 'TypeScript', 'Three.js', 'Angular Material'],
    url: 'https://room-tour-and-descriptions.vercel.app/',
  },
  {
    id: 'crossy-road',
    title: 'Mega Basic Crossy Road',
    category: { en: 'Game · For fun', es: 'Juego · Por diversión' },
    description: {
      en: 'Browser-based 3D Crossy Road clone with collision detection and keyboard-controlled gameplay.',
      es: 'Clon de Crossy Road en 3D para el navegador, con detección de colisiones y jugabilidad controlada con el teclado.',
    },
    stack: ['TypeScript', 'Three.js', 'Vite'],
    url: 'https://mega-basic-crossy-road.vercel.app/',
  },
]
