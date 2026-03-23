# Full SEO Audit Report — frxncismor.dev
**Audited:** March 23, 2026
**Site:** Francisco Moreno - Senior Web UI Engineer | Portfolio
**URL:** https://www.frxncismor.dev/home
**Framework:** Angular 20 SPA, deployed on Vercel

---

## Overall SEO Health Score: 49 / 100

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 22% | 54/100 | 11.9 |
| Content Quality (E-E-A-T) | 23% | 61/100 | 14.0 |
| On-Page SEO | 20% | 50/100 | 10.0 |
| Schema / Structured Data | 10% | 28/100 | 2.8 |
| Performance (CWV) | 10% | 50/100 | 5.0 |
| AI Search Readiness (GEO) | 10% | 36/100 | 3.6 |
| Images | 5% | 45/100 | 2.25 |
| **Total** | **100%** | — | **49.6 / 100** |

**Interpretation:** The site has strong content quality and a well-structured codebase, but a single architectural decision — client-side-only Angular rendering with no SSR — is suppressing scores across every category. The content, schema, meta tags, and structured data are all correct in code; they are simply invisible to crawlers because they require JavaScript to render. Fixing the rendering layer would push this score to ~70+ without any other changes.

---

## Executive Summary

### Business Type Detected
Personal brand / professional portfolio — freelance Senior Web UI Engineer (Francisco Moreno, The Woodlands TX). Target queries: "Senior Frontend Engineer", "Angular developer", "Web UI Engineer Houston TX".

### Top 5 Critical Issues

1. **No Server-Side Rendering (SSR)** — All content, meta tags, schema, and OG tags are injected by Angular after JS execution. Search engine crawlers see an empty `<app-root></app-root>`. Social scrapers (LinkedIn, Slack) see nothing useful.
2. **All cache headers are `max-age=0`** — Despite content-hashed filenames, every asset is served without long-term caching. Every repeat visitor revalidates ~10 files on every load.
3. **`addStructuredData()` bug: only one schema block can exist** — The method removes the existing schema before inserting a new one. Person + ProfilePage can never coexist on the page simultaneously.
4. **No `llms.txt`** — Missing the most accessible AI-search optimization. AI assistants like ChatGPT Browse, Perplexity, and Claude cannot find a structured machine-readable profile for Francisco.
5. **Duplicate canonical: `/` and `/home` both in sitemap at priority 1.0** — Angular redirects `''` → `'home'` client-side, but both URLs appear independently in the sitemap with identical content and identical ETags.

### Top 5 Quick Wins (Low effort, high impact)

1. **Create `llms.txt`** in `public/` — No code changes, bypasses JS rendering entirely, makes Francisco directly citable by AI search tools.
2. **Add static `Person` + `WebSite` JSON-LD to `index.html`** — Two `<script>` tags in `<head>`, zero runtime dependency, immediately visible to all crawlers.
3. **Fix `vercel.json` caching headers** — One JSON file, eliminates revalidation overhead for all hashed assets on repeat visits.
4. **Create a branded OG card image** (1200×630 PNG) — Replaces the plain headshot in social share previews for LinkedIn, Slack, Twitter/X, iMessage.
5. **Add `<link rel="preload" as="image" href="/myphoto.webp" fetchpriority="high">`** to `index.html` — Two attributes, 300-800ms LCP improvement on mobile.

---

## Technical SEO — Score: 54/100

### Critical

**C-1: No SSR / Prerendering**
- **File:** `src/app/app.config.ts`, `package.json`
- All pages are pure CSR. The HTML shell Googlebot receives at every route is `<app-root></app-root>`. No `@angular/ssr` installed.
- **Impact:** Titles, descriptions, OG tags, structured data, and all page content exist only after JS executes. Googlebot renders JS eventually (days delay), but social scrapers, AI crawlers, Bing's lightweight crawler, and the Rich Results Test never see any of it.
- **Fix:** `ng add @angular/ssr`. Prerender known routes at build time. Blog slugs can use `PrerenderFallback`.

**C-2: Duplicate Canonical — `/` and `/home`**
- **File:** `src/app/app.routes.ts` line 4, `public/sitemap.xml`
- `{ path: '', redirectTo: 'home', pathMatch: 'full' }` makes `/` a client-side redirect to `/home`. Both are in the sitemap at `priority: 1.0`. The static `<link rel="canonical">` in `index.html` always points to `https://frxncismor.dev/` regardless of route.
- **Fix:** Remove `/` from sitemap. Enforce server-level 301 (Vercel redirect rule). Update canonical per route via `SEOService`.

**C-3: www vs non-www Inconsistency**
- **File:** `src/index.html` line 46, `public/sitemap.xml`
- The site serves `www.frxncismor.dev` but all canonical tags, sitemap URLs, OG tags, and robots.txt references use `frxncismor.dev` (apex). If both origins serve content without a 301, Google sees two separate origins.
- **Fix:** Add a Vercel redirect rule to 301 from apex to `www.` (or vice versa). Pick one and enforce it everywhere.

### High

**H-1: `SEOService` Never Updates the Canonical Tag**
- **File:** `src/app/services/seo.service.ts`
- `updateSEO()` updates `og:url` but never touches `<link rel="canonical">`. Every route carries `canonical: https://frxncismor.dev/`.
- **Fix:** Add `updateCanonical(path: string)` method to `SEOService`, call it from each page's `ngOnInit`.

**H-2: hreflang via Query Parameters**
- **File:** `public/sitemap.xml`
- `?lang=en` / `?lang=es` serve identical static HTML (the SPA ignores the param). Google requires each hreflang URL to return distinct content. No `x-default` entry. Implementation is currently non-functional.
- **Fix (short-term):** Remove hreflang entirely from sitemap until path-based i18n (`/en/home`, `/es/home`) is implemented. See `ACTION-PLAN.md`.

**H-3: Blog Post URLs Missing from Sitemap**
- **File:** `public/sitemap.xml`
- `/blog/values-vs-references-in-javascript`, `/blog/wtf-is-inmutability-in-js`, `/blog/how-to-setup-eslint-and-prettier-in-angular-20-projects` — none listed. These are the only long-form content on the site.
- **Fix:** Add all 3 slugs to sitemap with `<lastmod>` from frontmatter dates.

**H-4: Google Fonts Loaded via CSS `@import` (Render-Blocking)**
- **File:** `src/styles.css` line 2
- `@import url('https://fonts.googleapis.com/...')` is render-blocking. The browser cannot request the font until the stylesheet is parsed.
- **Fix:** Replace with `<link rel="preload" as="style">` + `<noscript>` fallback in `index.html`. Reduce loaded weights from 6 to 2-3 actually used.

### Medium

| ID | Issue | File |
|---|---|---|
| M-1 | `<html lang="en">` is static, never updated to `es` | `src/index.html` line 1 |
| M-2 | Structured data injected via `document.createElement` (not in HTML) | `src/app/services/seo.service.ts` lines 81-93 |
| M-3 | `revisit-after` meta tag — ignored by all search engines since 2007 | `src/index.html` line 19 |
| M-4 | `meta name="keywords"` with 22 terms — may be spam signal on Bing | `src/index.html` lines 14-15 |
| M-5 | No `lastmod` on any sitemap entry | `public/sitemap.xml` |
| M-6 | Inline theme-detection script blocks CSP nonce strategy | `src/index.html` lines 57-79 |

### Low

| ID | Issue |
|---|---|
| L-1 | No IndexNow key — missing instant indexing notification for Bing/Yandex |
| L-2 | `<nav>` used for CTA buttons in hero (semantic misuse) |
| L-3 | External links inconsistently use `rel="noopener"` vs `rel="noopener noreferrer"` |

---

## Content Quality / E-E-A-T — Score: 61/100 (E-E-A-T: 64/100)

| Dimension | Score |
|---|---|
| Experience | 72/100 |
| Expertise | 68/100 |
| Authoritativeness | 58/100 |
| Trustworthiness | 58/100 |

**Positive signals found in source:**
- Hero copy names enterprise clients by name: Royal Caribbean, United Airlines, Dick's Sporting Goods
- 22 verifiable certifications with credential IDs and external URLs
- 8+ real projects with GitHub links and live demo URLs
- Blog posts with working code examples and correct technical knowledge
- EF SET C2 English certificate
- Explicit US work authorization and location signal (The Woodlands, TX)

### Critical

**C-1: All Content Invisible to Non-JS Crawlers**
- Every section — hero, bio, work history, projects, certifications — is loaded from `en.json` via Angular at runtime. The static HTML body is empty.

**C-2: Duplicate Content `/` and `/home`**
- Same `Content-Length` and `ETag` confirmed. Canonical always resolves to `/`.

### High

**H-1: Work Experience Entries Lack Specificity**
- **File:** `src/assets/i18n/en.json` lines 221-226
- Globant entry (5-year tenure): "Built enterprise solutions for global brands through Globant in sectors like retail, travel and media." — one generic sentence. No metrics, deliverables, or outcomes.
- **Fix:** Add 2-3 bullet points with specific projects, technologies, team scale, and outcomes. The hero already names the clients — surface that specificity in the experience section.

**H-2: No Privacy Policy**
- Analytics collected (Umami). Contact form and phone present. Price quote tool collects project data. No `/privacy` route in `app.routes.ts`.
- **Fix:** Add a minimal `/privacy` route.

**H-3: Blog Posts Have No Crawlable Fallback**
- Posts loaded via `HttpClient` fetching markdown at runtime. Google may index eventually but Bing, DuckDuckGo, and AI crawlers will not.

### Medium

| ID | Issue |
|---|---|
| M-1 | Meta description is 175 chars — truncated at ~155 in SERPs, cuts off location signal |
| M-2 | Blog post titles contain emoji (e.g., "✨", "⚛️") — stripped by AI extraction pipelines |
| M-3 | Keyword inconsistency: "Senior Web UI Engineer" (title) vs "Senior Fullstack Engineer" (hero copy) |
| M-4 | Certifications page has no introductory text — under 100 words total visible content |
| M-5 | Raw `.md` files at `/assets/posts/en/*.md` are publicly accessible — thin duplicate content risk |

---

## On-Page SEO — Score: 50/100

| Element | Status | Notes |
|---|---|---|
| Title tag | PASS | "Francisco Moreno - Senior Web UI Engineer \| Portfolio" — 59 chars, well-formed |
| Meta description | FAIL | 175 chars (too long), absent for inner pages in static HTML |
| H1 | UNKNOWN | Rendered by Angular; not in static HTML |
| Canonical | FAIL | Static, route-blind, www/apex mismatch |
| OG tags | PARTIAL | Present in static HTML for home; not updated per-route in static HTML |
| Twitter Card | PASS | All 5 required tags present |
| Robots meta | PASS | No noindex directives |
| Internal linking | UNKNOWN | Client-side rendered; not crawlable |

---

## Schema / Structured Data — Score: 28/100

### What Exists (in code, NOT in crawlable HTML)

| Page | Schema Type | Crawlable? |
|---|---|---|
| `/home` | `Person` | No — JS-injected |
| `/blog` | `Blog` | No — JS-injected |
| `/blog/:slug` | `BlogPosting` | No — JS-injected |
| `/certifications` | None | — |
| `/price-quote-generator` | None | — |

### Critical Bugs

**Bug 1: `addStructuredData()` Allows Only One Schema Block**
- **File:** `src/app/services/seo.service.ts` lines 81-93
- The method uses `id="structured-data"` and removes the existing element before inserting a new one. `Person` and `ProfilePage` cannot coexist. `WebSite` would overwrite `Person`.
- **Fix:** Use unique IDs per schema type (e.g., `structured-data-person`, `structured-data-website`).

**Bug 2: `BlogPosting` Missing `publisher.logo`**
- **File:** `src/app/pages/blog/blog-detail.ts` lines 79-108
- Google requires `publisher.logo` as an `ImageObject` for Article rich results. Without it, blog posts are ineligible for rich result display.
- **Fix:** Add `"image": { "@type": "ImageObject", "url": "https://frxncismor.dev/myphoto.webp", "width": 400, "height": 400 }` to the `publisher` object.

**Bug 3: `Person` Schema Missing `image` Property**
- Google uses `image` for knowledge panels and AI Overview entity boxes.
- **Fix:** Add `"image": { "@type": "ImageObject", "url": "https://frxncismor.dev/myphoto.webp" }` to the Person block.

### Missing Schema Opportunities

| Type | Page | Priority |
|---|---|---|
| `WebSite` (with SearchAction) | Global | Critical |
| `ProfilePage` | `/home` | High |
| `ItemList` of certifications | `/certifications` | High |
| `BreadcrumbList` | All inner pages | Medium |
| `Service` | `/price-quote-generator` | Low |

### Ready-to-Use: Add to `src/index.html` `<head>` (No SSR required)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://frxncismor.dev/#website",
      "name": "Francisco Moreno Portfolio",
      "url": "https://frxncismor.dev",
      "description": "Senior Web UI Engineer with 6+ years building enterprise web apps. Angular, React, TypeScript.",
      "inLanguage": ["en-US", "es-ES"],
      "author": { "@id": "https://frxncismor.dev/#person" }
    },
    {
      "@type": "Person",
      "@id": "https://frxncismor.dev/#person",
      "name": "Francisco Moreno",
      "jobTitle": "Senior Web UI Engineer",
      "description": "Senior Fullstack Engineer with 6+ years building scalable web apps for enterprise clients like Royal Caribbean, United Airlines, and Dick's Sporting Goods.",
      "image": {
        "@type": "ImageObject",
        "url": "https://frxncismor.dev/myphoto.webp"
      },
      "url": "https://frxncismor.dev",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "The Woodlands",
        "addressRegion": "TX",
        "addressCountry": "US"
      },
      "sameAs": [
        "https://linkedin.com/in/frxncismor",
        "https://github.com/frxncismor",
        "https://twitter.com/frxncismor"
      ],
      "knowsAbout": ["Angular", "React", "TypeScript", "JavaScript", "Next.js", "RxJS", "NgRx", "Node.js", "AWS", "MongoDB", "PostgreSQL"]
    }
  ]
}
</script>
```

---

## Performance (Core Web Vitals) — Score: 50/100

| Metric | Estimated Status | Risk |
|---|---|---|
| LCP | At Risk | Hero image discovered post-JS-bootstrap; no preload hint |
| CLS | At Risk | `primeicons` uses `font-display: block`; 6 font weights with FOUT risk |
| INP | At Risk | Zone.js + scroll handlers on main thread |
| TTFB | Pass (214ms on cache HIT) | Vercel CDN active |

### Critical

**C-1: All Assets Served with `max-age=0`**
- **File:** Missing `vercel.json`
- Content-hashed filenames (`main-7GC7VTP5.js`, `styles-WRX4F74X.css`) are designed for immutable caching. Current headers force revalidation on every request.
- **Fix:** Create `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)-([A-Z0-9]{8})\\.(js|css|woff2|webp)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

### High

**H-1: LCP Image Not Preloaded**
- `myphoto.webp` (70KB) is the probable LCP element but is rendered by Angular post-bootstrap.
- **Fix:** Add to `index.html`:
```html
<link rel="preload" as="image" href="/myphoto.webp" fetchpriority="high">
```
Also add `fetchpriority="high"` to the `<img>` element in the hero template.

**H-2: Zone.js Present**
- 34KB of Zone.js polyfills trigger change detection on every event/timer. Angular 18+ supports stable zoneless.
- **Fix:** Migrate to `provideExperimentalZonelessChangeDetection()` in `main.ts`. Remove `zone.js` from `polyfills.ts`.

### Medium

| ID | Issue | Fix |
|---|---|---|
| M-1 | `primeicons` uses `font-display: block` (FOIT, CLS risk) | Override to `font-display: swap` in global styles |
| M-2 | 6 Kedebideri font weights loaded (likely only 2-3 needed) | Audit and drop unused weights |
| M-3 | `chunk-PEL66XHN.js` at 208KB uncompressed (PrimeNG) | Audit PrimeNG component usage; replace heavy ones |
| M-4 | Scroll handlers on main thread (not using `IntersectionObserver`) | Migrate animations to `IntersectionObserver` + `runOutsideAngular` |

### Low

| ID | Issue |
|---|---|
| L-1 | Unused `<link rel="preconnect" href="https://images.unsplash.com">` |
| L-2 | 6 legacy icon formats in CSS (eot, ttf, svg) — only woff2 needed post-2016 |

### What Is Already Done Well
- Beasties critical CSS inlining (no render-blocking CSS)
- Non-blocking stylesheet (`media="print" onload`)
- All JS loaded as `type="module"` (deferred by default)
- `modulepreload` for all lazy chunks
- `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com`
- Hero image already in WebP format
- HSTS enabled (`max-age=63072000`)
- Vercel CDN active (TTFB 214ms on cache HIT)

---

## AI Search Readiness (GEO) — Score: 36/100

| Dimension | Score |
|---|---|
| Citability | 28/100 |
| Structural Readability | 30/100 |
| Multi-Modal Content | 50/100 |
| Authority & Brand Signals | 35/100 |
| Technical Accessibility | 42/100 |

### Platform Scores

| Platform | Score | Key Reason |
|---|---|---|
| Google AI Overviews | 18/100 | Googlebot renders JS, but no static JSON-LD, no llms.txt |
| ChatGPT Browse | 8/100 | GPTBot cannot render JS; sees only title + meta description |
| Perplexity | 10/100 | PerplexityBot cannot render JS |
| Bing Copilot | 12/100 | Partial JS rendering; schema still client-side only |

### Critical

**C-1: No `llms.txt`**
- Highest-ROI fix available. Create `public/llms.txt` — served as a static file, bypasses JS rendering entirely.
- AI assistants that browse `llms.txt` (ChatGPT, Perplexity, Claude) can read structured identity info directly.

**C-2: All Content JS-Rendered (Invisible to AI Crawlers)**
- GPTBot, ClaudeBot, PerplexityBot, CCBot do not execute JavaScript. The entire site content is inaccessible.
- The only text AI crawlers currently see: the static `<title>` and `<meta name="description">`.

### High

**H-1: JSON-LD Injected at Runtime Only**
- See Schema section. Adding to `index.html` statically fixes this without SSR.

**H-2: No YouTube or Reddit Presence for Entity Disambiguation**
- "Francisco Moreno" is a common name. YouTube mentions (~0.737 correlation with AI citations) and Reddit activity are the two strongest off-site disambiguation signals.

### Medium

**M-1: About Me Bio Not Optimized for AI Passage Extraction**
- Current bio uses rhetorical opener ("I don't just write code"). AI extraction favors factual first sentences: "Francisco Moreno is a Senior Fullstack Engineer based in The Woodlands, TX..."

### Recommended `llms.txt` Content (create at `public/llms.txt`)

```
# Francisco Moreno

Francisco Moreno is a Senior Web UI Engineer based in The Woodlands, TX.
He has 6+ years of experience building scalable enterprise web applications.
He is authorized to work in the United States.

## Enterprise Experience
- Built enterprise web solutions at Globant for clients including Royal Caribbean, United Airlines, and Dick's Sporting Goods
- Current employer: Globant (2020-present)
- Previous: Handa Systems, Upwork freelance

## Technical Specializations
Angular, React, TypeScript, JavaScript, Next.js, RxJS, NgRx, Node.js, Supabase, AWS, MongoDB, PostgreSQL, Docker

## Current Projects
- Kindnest: A platform connecting nonprofits with volunteers and donors (in development)
- Shelfie: AI-powered personal library management SaaS (shelfie.com.mx)

## Portfolio Pages
- Home / About: https://frxncismor.dev/home
- Blog (technical articles on Angular, JavaScript): https://frxncismor.dev/blog
- Certifications: https://frxncismor.dev/certifications
- Freelance pricing: https://frxncismor.dev/price-quote-generator

## Blog Posts
- Values vs References in JavaScript: https://frxncismor.dev/blog/values-vs-references-in-javascript
- What is Immutability in JS: https://frxncismor.dev/blog/wtf-is-inmutability-in-js
- How to Set Up ESLint and Prettier in Angular Projects: https://frxncismor.dev/blog/how-to-setup-eslint-and-prettier-in-angular-20-projects

## Contact
- Email: frxncismor@gmail.com
- LinkedIn: https://linkedin.com/in/frxncismor
- GitHub: https://github.com/frxncismor
- Twitter/X: @frxncismor
```

---

## Images — Score: 45/100

### High

**H-1: OG Image Is a Personal Photo, Not a Branded Social Card**
- `og:image` and `twitter:image` both point to `myphoto.webp` — a plain headshot.
- Served from apex domain; Vercel 307-redirects to `www.` — some scrapers drop image on redirect.
- Missing: `og:image:width`, `og:image:height`, `og:image:alt`, `twitter:image:alt`.
- No WebP support in older LinkedIn/Facebook scrapers.
- **Fix:** Create a 1200×630 PNG branded social card. Update both OG and Twitter image tags to reference it from the `www.` subdomain.

```html
<meta property="og:image" content="https://www.frxncismor.dev/og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Francisco Moreno — Senior Web UI Engineer">
<meta name="twitter:image" content="https://www.frxncismor.dev/og-card.png">
<meta name="twitter:image:alt" content="Francisco Moreno — Senior Web UI Engineer">
```

### Medium

**M-1: Favicon Incomplete**
- `apple-touch-icon.png` exists but not linked in `<head>`.
- `manifest.json` and `site.webmanifest` both exist and return 200 but neither is linked in `<head>`.
- **Fix:** Add to `<head>`:
```html
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#121212" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
```

---

## Sitemap — Score: 55/100

| Check | Status |
|---|---|
| XML syntax validity | PASS |
| robots.txt sitemap reference | PASS |
| www vs non-www consistency | PASS (all non-www) |
| `lastmod` present | FAIL — missing on all entries |
| Duplicate canonical URLs | FAIL — `/` and `/home` both listed |
| hreflang implementation | FAIL — query params, non-functional |
| Blog post URLs | FAIL — 3 posts missing |
| `priority` / `changefreq` | INFO — both ignored by Google |

**Corrected sitemap** (see `ACTION-PLAN.md`).

---

## Key Files Referenced

| File | Issues |
|---|---|
| `src/index.html` | Static canonical, missing JSON-LD, missing manifest link, missing apple-touch-icon, missing OG image dimensions |
| `public/sitemap.xml` | Duplicate home URLs, broken hreflang, missing blog posts, no lastmod |
| `src/app/services/seo.service.ts` | Single-block schema bug, no canonical update |
| `src/app/app.routes.ts` | Client-side redirect `''` → `'home'` |
| `src/app/pages/home/home.ts` | Person schema missing image property |
| `src/app/pages/blog/blog-detail.ts` | BlogPosting missing publisher.logo |
| `src/assets/i18n/en.json` | Work experience too generic; meta description too long |
| `src/styles.css` | Render-blocking Google Fonts @import |
| `package.json` | No `@angular/ssr` |
| `vercel.json` | Missing (no caching headers configured) |
| `public/llms.txt` | Missing (does not exist) |
