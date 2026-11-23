# frxncismor.dev — Portfolio v3

**Live:** [frxncismor.dev](https://frxncismor.dev)

Personal portfolio for Francisco Moreno — Full-Stack Software Engineer with 6 years building production systems for Disney, Royal Caribbean, United Airlines and OXXO.

---

## What this site demonstrates

- **Zero-framework frontend** — built with Astro 4 SSG and vanilla TypeScript. No React, no Vue. Every kilobyte is intentional.
- **Bilingual (EN/ES)** — client-side language toggle with `localStorage` persistence and zero flash on reload, implemented without a library.
- **Performance-first** — targets Lighthouse 100 across all categories. Static output, optimized fonts, deferred scripts, auto-generated sitemap.
- **Editorial design system** — dark by default with a light theme (`prefers-color-scheme` or the sun/moon toggle, saved in `localStorage`, applied before first paint). All colors live as tokens in `src/styles/tokens.css`; no hard-coded colors in components. Subtle motion (scroll reveal, hover) that switches off with `prefers-reduced-motion`.
- **Accessible markup** — semantic HTML, `aria-label` on all interactive elements, skip-nav link, fully keyboard navigable.
- **Blog with search** — Astro Content Collections, client-side keyword search and category filter, zero external dependencies.
- **Clean architecture** — typed data layer, strict TypeScript, separation between data, layout, and i18n.

---

## Stack

Astro 4 · TypeScript · Tailwind CSS v3 · Vanilla JS · Vercel

**Fonts** (Google Fonts): Fraunces (headlines, logo), Geist (text) and Geist Mono (labels, code).

## Structure

```
src/components/   Astro sections (Hero, Work, Process, Experience, Toolkit, Writing, Templates, About, Contact…) and blog/ pieces
src/data/         Typed content (projects, experience, process, toolkit, templates, about)
src/i18n/         EN/ES translations (translations.ts) and the Localized type
src/content/      Blog posts: blog-en/ and blog-es/ (Astro Content Collections)
src/styles/       tokens.css (design tokens, both themes) and global.css
src/scripts/      Client scripts: theme, i18n, nav, animations, blog filters, article (TOC, progress, copy)
docs/redesign/    Design handoff and the reference prototype
```

```bash
npm run dev      # local dev server
npm run build    # static build to dist/
```

---

## About me

Angular specialist and full-stack engineer based in Houston, TX. I've shipped production frontends, .NET and Node.js APIs, SQL databases, Docker infrastructure, and full observability stacks (Datadog, Sentry) for enterprise clients at Globant.

Open to full-time roles and freelance projects in the US.

**Links:** [frxncismor.dev](https://frxncismor.dev) · [LinkedIn](https://www.linkedin.com/in/frxncismor) · [GitHub](https://github.com/frxncismor)
