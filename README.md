# frxncismor.dev — Portfolio v3

**Live:** [frxncismor.dev](https://frxncismor.dev)

Personal portfolio for Francisco Moreno — Full-Stack Software Engineer with 6 years building production systems for Disney, Royal Caribbean, United Airlines and OXXO.

---

## What this site demonstrates

- **Zero-framework frontend** — built with Astro 4 SSG and vanilla TypeScript. No React, no Vue. Every kilobyte is intentional.
- **Bilingual (EN/ES)** — English at `/`, Spanish at `/es/`, both rendered on the server with `hreflang` links. The language selector is a plain link to the equivalent route, no client-side switching and no library.
- **Performance-first** — targets Lighthouse 100 across all categories. Static output, optimized fonts, deferred scripts, auto-generated sitemap.
- **Editorial design system** — dark by default with a light theme (`prefers-color-scheme` or the sun/moon toggle, saved in `localStorage`, applied before first paint). All colors live as tokens in `src/styles/tokens.css`; no hard-coded colors in components. Subtle motion (scroll reveal, hover) that switches off with `prefers-reduced-motion`.
- **Accessible markup** — semantic HTML, accessible names on icon-only controls, skip-nav link, fully keyboard navigable, visible focus (also in Windows high-contrast mode).
- **Language-aware metadata** — title, meta description, Open Graph tags and JSON-LD are rendered per language in the static HTML. Each blog post gets its own Open Graph image (EN/ES), generated at build time (`src/lib/og.ts`).
- **Blog with search** — Astro Content Collections, client-side keyword search and category filter, zero external dependencies.
- **Paginated blog** — 9 posts per page (`BLOG_PAGE_SIZE` in `src/lib/posts.ts`): `/blog`, `/blog/page/2`, … and `/es/blog/…`. Page 1 is `/blog` (there is no `/blog/page/1`); the featured post only appears there and counts as one of its 9. Each page has its own canonical, hreflang pair, `rel=prev/next` and a " — Page N" title. Search and topic filters query an index of *every* post of the language, embedded as small JSON (`#blog-search-index`: title, summary, date, topic, slug, href; it replaces the old per-page manifest, no extra request). While a search or filter is active the matches replace the paginated list and the pager is hidden; without JS the filters are hidden and the pagination works as plain links.
- **Clean architecture** — typed data layer, strict TypeScript, separation between data, layout, and i18n.

---

## Stack

Astro 4 · TypeScript · Tailwind CSS v3 · Vanilla JS · Vercel

## Analytics

Vercel Web Analytics (`@vercel/analytics`) and Speed Insights (`@vercel/speed-insights`), added once in `src/layouts/Layout.astro` so every EN/ES page carries them. Cookie-free, no custom events.

They only report once enabled in the Vercel dashboard: project → **Analytics** → **Enable**, and project → **Speed Insights** → **Enable**, then redeploy. Until then the scripts request `/_vercel/insights/*` and `/_vercel/speed-insights/*` and get a 404, with no other effect. Locally (`npm run dev`) the scripts load in debug mode and send nothing.

**Fonts** (Google Fonts): Fraunces (headlines, logo), Geist (text) and Geist Mono (labels, code).

## Structure

```
src/components/   Astro sections (Hero, Work, Process, Experience, Toolkit, Writing, Templates, About, Contact…) and blog/ pieces
src/data/         Typed content (projects, experience, process, toolkit, templates, about) and site.ts (email, social links, nav, clients)
src/lib/          posts.ts (EN/ES post pairing; the build fails if a translation is missing), json.ts, readingTime.ts, og.ts (per-post Open Graph images), rehype plugin for `es-` heading ids
src/i18n/         EN/ES translations (translations.ts) and the Localized type
src/content/      Blog posts: blog-en/ and blog-es/ (Astro Content Collections)
src/styles/       tokens.css (design tokens, both themes) and global.css
src/scripts/      Client scripts: theme, nav, animations, blog filters, article (TOC, progress, copy)
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
