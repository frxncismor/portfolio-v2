# frxncismor.dev — Portfolio v3

Personal portfolio built with Astro 4 (SSG). Ships zero client-side JavaScript frameworks — all interactivity is vanilla TS. Scores 100 across all Lighthouse categories.

**Live:** [frxncismor.dev](https://frxncismor.dev)

---

## Stack

| Layer | Tool |
|-------|------|
| Framework | [Astro 4](https://astro.build) — static output |
| Styles | Tailwind CSS v3 with custom design tokens |
| Language | TypeScript (strict) |
| Runtime JS | Vanilla TS — animations + i18n toggle |
| Content | Astro Content Collections (blog EN/ES) |
| Sitemap | `@astrojs/sitemap` (auto-generated) |
| Deploy | Vercel |

---

## Features

- **Bilingual (EN/ES)** — client-side toggle with `localStorage` persistence, zero flash on reload
- **Blog** — markdown posts in two collections (`blog-en`, `blog-es`), keyword search, category filter
- **Work section** — project cards driven by `src/data/projects.ts`, cover-link pattern for valid HTML
- **Templates section** — Gumroad products via `src/data/templates.ts`
- **Scroll animations** — IntersectionObserver with staggered fade-ins, no GSAP dependency
- **SEO** — canonical URLs, Open Graph, Twitter cards, structured sitemap

---

## Local development

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static output → dist/
npm run preview   # preview the build locally
```

---

## Project structure

```
src/
├── components/       # Astro components (Nav, Hero, Work, Blog, …)
├── content/
│   ├── blog-en/      # Markdown posts — English
│   └── blog-es/      # Markdown posts — Spanish
├── data/             # Typed content: projects, experience, stack, templates
├── i18n/
│   └── translations.ts   # All EN/ES strings
├── layouts/
│   └── Layout.astro      # Base layout with SEO head
├── pages/
│   ├── index.astro
│   └── blog/
│       ├── index.astro
│       └── [slug].astro
└── scripts/
    ├── animations.ts     # IntersectionObserver fade-ins
    ├── blog.ts           # Search + filter logic
    └── i18n.ts           # Language toggle
```

---

## Adding a project

Edit `src/data/projects.ts` and add an entry to the `projects` array:

```ts
{
  id: 'my-project',           // used as the i18n key prefix
  title: 'My Project',
  category: 'CATEGORY · TAG',
  description: 'English description shown at build time.',
  stack: ['Astro', 'TypeScript'],
  accentColor: '#7F77DD',
  url: 'https://my-project.vercel.app',
  wip: true,                  // optional — shows WIP badge
}
```

To add a Spanish description, add matching keys in `src/i18n/translations.ts`:

```ts
// en
'project.my-project.description': 'English description.',
// es
'project.my-project.description': 'Descripción en español.',
```

---

## License

MIT
