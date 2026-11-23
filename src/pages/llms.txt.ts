import type { APIRoute } from 'astro'
import { getPosts } from '../lib/posts'

const SITE = 'https://frxncismor.dev'

/** Hand-written entries the file shipped with: their order and labels are kept as-is. */
const CURATED: ReadonlyArray<readonly [slug: string, label: string]> = [
  ['dotnet-10-api-that-earns-trust', 'Building a .NET 10 API You Can Trust: Minimal APIs, Validation, ProblemDetails and Real Tests'],
  ['angular-21-ssr-fastify-drizzle-monorepo', 'One Monorepo, Full Stack: Angular 21 SSR, Fastify, Drizzle and PostgreSQL in Docker'],
  ['angular-signals', 'Angular Signals: A Practical Introduction'],
  ['from-frontend-to-full-stack', 'From Frontend to Full-Stack: What Actually Changes When You Own the Whole System'],
  ['how-to-setup-eslint-and-prettier-in-angular-20-projects', 'How to Setup ESLint and Prettier in Angular 20 Projects'],
  ['values-vs-references-in-javascript', 'Values vs References in JavaScript'],
  ['web-dev-in-2026-with-ai', "What It's Like to Be a Web Developer in 2026"],
  ['wtf-is-inmutability-in-js', 'WTF Is Immutability in JavaScript?'],
]

export const GET: APIRoute = async () => {
  const posts = await getPosts()
  const curated = new Map(CURATED)
  const line = (slug: string, label: string) => `- [${label}](${SITE}/blog/${slug})`
  const added = posts.filter((p) => !curated.has(p.slug)).map((p) => line(p.slug, p.titleEn))
  const legacy = CURATED.filter(([slug]) => posts.some((p) => p.slug === slug)).map(([slug, label]) => line(slug, label))
  return new Response(body([...added, ...legacy].join('\n')), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

const body = (blogList: string): string =>
  `# Francisco Moreno — Full-Stack Software Engineer

> Full-stack software engineer based in Houston, TX. 6 years building production systems for Disney, Royal Caribbean, United Airlines, and more — Angular frontends, .NET and Node.js APIs, PostgreSQL. Currently a Backend Engineer at Valtre, building a .NET 10 API for OXXO. Available for freelance projects and full-time opportunities in the US.

## About

Francisco Moreno is a full-stack software engineer with expertise in Angular, TypeScript, React, Astro, .NET and Node.js. He delivered enterprise-grade products at Globant for Fortune 500 companies including Disney, Royal Caribbean, United Airlines, Dick's Sporting Goods, and Gannett, and currently builds a .NET 10 API for OXXO at Valtre with an AI-assisted, quality-first workflow. Based in Houston, TX, originally from Monterrey, Mexico.

## Skills & Expertise

- Angular (specialist), TypeScript, RxJS, Angular Signals
- React, Next.js, Astro
- Backend: .NET 10 / C#, Node.js (Fastify, Express), PostgreSQL, Drizzle ORM, REST APIs
- Frontend architecture: Clean Architecture, Atomic Design, Hexagonal Architecture
- Performance optimization, Core Web Vitals, Lighthouse 100
- Tailwind CSS, SCSS, CSS-in-JS
- Testing: Jest, Cypress, Playwright
- Quality & DevOps: automated testing (Vitest, Playwright), CI with GitHub Actions, Docker
- AI-assisted development: Claude Code, GitHub Copilot, Codex, MCP servers, agent skills, agent orchestration (Herdr), spec-driven development, harness engineering, human-in-the-loop review

## Work Experience

- **Valtre** (current) — DevCrossQA · Backend Engineer. Building a .NET 10 API for OXXO with an AI-assisted workflow (GitHub Copilot, Claude, Codex); owns the backend code end to end, applies engineering best practices and tests everything shipped.
- **Globant** (5 years) — Senior Software Engineer. Production-grade frontends for Disney, Royal Caribbean, United Airlines, Dick's Sporting Goods and Gannett.
- **Freelance & Independent**:
  - RegioLabs (client project) — AI WhatsApp bots and website for an automation studio in Monterrey, Mexico. https://regiolabs.com.mx/
  - Caro Sweet MUA — Brand and booking site for a professional makeup artist. https://caro-sweet-mua.vercel.app/

## Selected Projects

- **Grim Builds** (WIP) — Build-guide platform for Grim Dawn: Angular 21 SSR, Fastify + Drizzle API, PostgreSQL, shared Zod domain, hardened Docker setup, CI with property-based, e2e, accessibility and Lighthouse checks. https://github.com/frxncismor/grim-dawn-builds
- **Nox Coffee** — Scroll-driven brand experience for a fictional coffee company (Astro, GSAP, Lenis). https://nox-coffee.vercel.app/
- **Room Tour & Descriptions** — Interactive 3D room viewer with orbit controls, teleportation navigation and object interaction (Angular, Three.js). https://room-tour-and-descriptions.vercel.app/
- **Mega Basic Crossy Road** — Browser-based 3D Crossy Road clone (TypeScript, Three.js, Vite). https://mega-basic-crossy-road.vercel.app/

## Templates

- **ZooNova** ($25) — Complete HTML5 + Tailwind CSS template for zoos and wildlife parks, six designed pages. https://frxncismor.gumroad.com/l/zoo-nova-html

## Blog

Technical writing on Angular, .NET, Node.js, JavaScript, frontend architecture, and AI-assisted development. Available in English and Spanish.

A Spanish version of the whole site lives under https://frxncismor.dev/es/ (same paths, e.g. https://frxncismor.dev/es/blog/angular-signals).

${blogList}

## Contact

- Email: frxncismor@gmail.com
- GitHub: https://github.com/frxncismor
- LinkedIn: https://linkedin.com/in/frxncismor
- Website: https://frxncismor.dev
`
