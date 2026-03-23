# SEO Action Plan — frxncismor.dev
**Generated:** March 23, 2026
**Current Score:** 49/100 → **Projected Score after all fixes: ~78/100**

---

## Priority Legend
- **Critical** — Blocks indexing or major ranking signal loss. Fix immediately.
- **High** — Significant ranking/visibility impact. Fix within 1 week.
- **Medium** — Optimization opportunity. Fix within 1 month.
- **Low** — Nice to have. Backlog.

---

## CRITICAL (Fix Now)

### C-1: Add `llms.txt` — AI Search Identity File
**Effort:** 30 min | **Impact:** GEO +15 pts | **No code changes to Angular app**

Create `public/llms.txt` with the content from the audit report. This is a static file served alongside `robots.txt`. It bypasses the JS rendering problem entirely and makes Francisco directly citable by ChatGPT Browse, Perplexity, and Claude.

```
# Create the file
public/llms.txt
```

Full file content is in `SEO-AUDIT-REPORT.md` under the GEO section.

---

### C-2: Add Static JSON-LD to `index.html`
**Effort:** 30 min | **Impact:** Schema +20 pts, GEO +5 pts | **No SSR required**

Add a combined `WebSite` + `Person` `@graph` block directly in `<head>` of `src/index.html`. This makes schema visible to all crawlers immediately, zero JS dependency.

Full JSON-LD snippet is in `SEO-AUDIT-REPORT.md` under the Schema section.

---

### C-3: Fix `Cache-Control` Headers — Create `vercel.json`
**Effort:** 15 min | **Impact:** Performance +15 pts**

Create `vercel.json` in the project root:

```json
{
  "headers": [
    {
      "source": "/(.*)-([A-Z0-9]{8})\\.(js|css|woff2|webp)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    }
  ]
}
```

---

### C-4: Fix `addStructuredData()` — Allow Multiple Schema Blocks
**Effort:** 15 min | **Impact:** Schema integrity**
**File:** `src/app/services/seo.service.ts`

Change the method to accept a `type` parameter for unique IDs so `Person`, `WebSite`, `ProfilePage` can coexist:

```typescript
addStructuredData(data: object, type: string = 'default'): void {
  const id = `structured-data-${type}`;
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}
```

Then update call sites:
- `home.ts`: `this.seoService.addStructuredData(personData, 'person')`
- `blog.ts`: `this.seoService.addStructuredData(blogData, 'blog')`
- `blog-detail.ts`: `this.seoService.addStructuredData(postData, 'blogposting')`

---

### C-5: Fix `BlogPosting` — Add `publisher.logo`
**Effort:** 10 min | **Impact:** Unlocks Google Article rich results**
**File:** `src/app/pages/blog/blog-detail.ts`

Replace the `publisher` node in the `structuredData` object:

```typescript
publisher: {
  '@type': 'Person',
  '@id': 'https://frxncismor.dev/#person',
  name: 'Francisco Moreno',
  image: {
    '@type': 'ImageObject',
    url: 'https://frxncismor.dev/myphoto.webp',
    width: 400,
    height: 400
  }
}
```

---

### C-6: Fix `Person` Schema — Add `image` and `description`
**Effort:** 10 min | **Impact:** Knowledge panel eligibility**
**File:** `src/app/pages/home/home.ts`

Add to the Person structured data object:
```typescript
image: {
  '@type': 'ImageObject',
  url: 'https://frxncismor.dev/myphoto.webp',
  width: 400,
  height: 400
},
description: 'Senior Fullstack Engineer with 6+ years building scalable web apps for enterprise clients including Royal Caribbean, United Airlines, and Dick\'s Sporting Goods.'
```

---

### C-7: Fix Sitemap — Remove Duplicate, Add Blog Posts, Fix hreflang
**Effort:** 20 min | **File:** `public/sitemap.xml`

Replace the entire sitemap with:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://frxncismor.dev/home</loc>
    <lastmod>2026-03-23</lastmod>
  </url>
  <url>
    <loc>https://frxncismor.dev/certifications</loc>
    <lastmod>2026-03-23</lastmod>
  </url>
  <url>
    <loc>https://frxncismor.dev/price-quote-generator</loc>
    <lastmod>2026-03-23</lastmod>
  </url>
  <url>
    <loc>https://frxncismor.dev/blog</loc>
    <lastmod>2026-03-23</lastmod>
  </url>
  <url>
    <loc>https://frxncismor.dev/blog/values-vs-references-in-javascript</loc>
    <lastmod>2025-12-04</lastmod>
  </url>
  <url>
    <loc>https://frxncismor.dev/blog/wtf-is-inmutability-in-js</loc>
    <lastmod>2025-12-04</lastmod>
  </url>
  <url>
    <loc>https://frxncismor.dev/blog/how-to-setup-eslint-and-prettier-in-angular-20-projects</loc>
    <lastmod>2025-12-04</lastmod>
  </url>
</urlset>
```

Notes:
- Removed `/` (it's a redirect to `/home`, not a canonical URL)
- Removed broken `?lang=` hreflang (non-functional with CSR)
- Removed `priority` and `changefreq` (ignored by Google)
- Added 3 blog post URLs with real lastmod dates
- Added `lastmod` to all entries

---

## HIGH (Fix Within 1 Week)

### H-1: Create Branded OG Social Card Image
**Effort:** 2-4 hours | **Impact:** Visual/Social sharing quality**

Create a 1200×630 PNG image at `public/og-card.png` using Figma or Satori (code-gen option using your existing design tokens).

Update `src/index.html`:
```html
<!-- Replace existing og:image and twitter:image tags -->
<meta property="og:image" content="https://www.frxncismor.dev/og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Francisco Moreno — Senior Web UI Engineer">
<meta name="twitter:image" content="https://www.frxncismor.dev/og-card.png">
<meta name="twitter:image:alt" content="Francisco Moreno — Senior Web UI Engineer">
```

---

### H-2: Preload Hero Image + `fetchpriority="high"`
**Effort:** 10 min | **Impact:** LCP 300-800ms improvement on mobile**

Add to `src/index.html` `<head>`:
```html
<link rel="preload" as="image" href="/myphoto.webp" fetchpriority="high">
```

Add to hero component template (`src/app/components/hero/hero.html`):
```html
<img src="/myphoto.webp" fetchpriority="high" ... >
```

Remove the unused preconnect:
```html
<!-- Remove this line from index.html -->
<link rel="preconnect" href="https://images.unsplash.com">
```

---

### H-3: Fix Favicon — Link Manifest and Apple Touch Icon
**Effort:** 10 min | **File:** `src/index.html`

Add to `<head>` (files already exist, just not linked):
```html
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#121212" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
```

---

### H-4: Add `updateCanonical()` to `SEOService`
**Effort:** 30 min | **File:** `src/app/services/seo.service.ts`

```typescript
updateCanonical(path: string): void {
  const url = `https://frxncismor.dev${path}`;
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}
```

Then call from each page's `ngOnInit`:
- `home.ts`: `this.seoService.updateCanonical('/home')`
- `blog.ts`: `this.seoService.updateCanonical('/blog')`
- `certifications.ts`: `this.seoService.updateCanonical('/certifications')`
- `blog-detail.ts`: `this.seoService.updateCanonical('/blog/' + this.slug)`

---

### H-5: Fix Google Fonts Loading
**Effort:** 20 min | **File:** `src/styles.css`, `src/index.html`

Remove from `src/styles.css`:
```css
/* Remove this line */
@import url('https://fonts.googleapis.com/css2?family=Kedebideri:wght@400;500;600;700;800;900&display=swap');
```

Add to `src/index.html` `<head>` (non-blocking async font load):
```html
<link rel="preload" as="style"
  href="https://fonts.googleapis.com/css2?family=Kedebideri:wght@400;600;700&display=swap"
  onload="this.onload=null;this.rel='stylesheet'">
<noscript>
  <link rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Kedebideri:wght@400;600;700&display=swap">
</noscript>
```

Note: Reduced from 6 weights (400-900) to 3 (400, 600, 700). Audit which weights are actually used in your CSS before trimming further.

---

### H-6: Trim Meta Description to ≤155 Characters
**Effort:** 5 min | **Files:** `src/index.html` line 8, `src/assets/i18n/en.json`

Current (175 chars, truncated in SERPs):
> "Senior Web UI Engineer with 6+ years of experience. Specialized in Angular, React, TypeScript. Available for full-time and freelance projects. Based in The Woodlands, TX."

Recommended (≤155 chars):
> "Senior Web UI Engineer · 6+ yrs enterprise experience at Royal Caribbean & United Airlines · Angular, React, TypeScript · The Woodlands, TX"

---

### H-7: Fix `primeicons` Font Display
**Effort:** 10 min | **Impact:** CLS reduction**

Add to `src/styles.css`:
```css
/* Override PrimeNG's font-display: block for icons */
@font-face {
  font-family: primeicons;
  font-display: swap;
  src: url('/media/primeicons.woff2') format('woff2');
}
```

---

### H-8: Add Privacy Policy Page
**Effort:** 2-3 hours | **Impact:** E-E-A-T Trustworthiness**

Add route to `app.routes.ts`:
```typescript
{ path: 'privacy', loadComponent: () => import('./pages/privacy/privacy').then(c => c.PrivacyComponent) }
```

Create minimal page disclosing: Umami analytics (no cookies, no personal data), contact form handling, freelance project data handling.

---

### H-9: Improve Work Experience Copy Specificity
**Effort:** 1-2 hours | **File:** `src/assets/i18n/en.json`

Expand the Globant entry (2020-2025) from one generic sentence to 3 specific bullet points. Example direction:
- "Led frontend architecture for loyalty platform serving 2M+ Royal Caribbean members using Angular + NgRx"
- "Delivered microfrontend migration for United Airlines check-in flow, reducing bundle size by 40%"
- "Maintained design system adopted across 3 brand properties at Dick's Sporting Goods using Angular CDK"

(Use your actual project details — specificity matters more than the exact numbers.)

---

## MEDIUM (Fix Within 1 Month)

### M-1: Remove Emoji from Blog Post Titles
**Effort:** 5 min | **Files:** `src/assets/posts/en/*.md` frontmatter**

- `"How to Set Up ESLint and Prettier in Your Angular Projects ✨"` → remove `✨`
- `"⚛️ Values vs References in Javascript"` → remove `⚛️`

---

### M-2: Add Intro Text to Certifications Page
**Effort:** 30 min | **File:** `src/assets/i18n/en.json`, certifications page template**

Add 2-3 sentences above the certification list:
> "These 22 professional certifications reflect Francisco's commitment to continuous learning across frontend architecture, full-stack development, and cloud technologies. Credentials span Angular, React, JavaScript, Node.js, and database systems, issued by LinkedIn Learning, Platzi, HackerRank, and freeCodeCamp."

---

### M-3: Add `ItemList` Schema to Certifications Page
**Effort:** 1 hour | **File:** `src/app/pages/certifications/certifications.ts`

Add an `addStructuredData()` call with an `ItemList` schema generated from the certifications data array. Full snippet in `SEO-AUDIT-REPORT.md`.

---

### M-4: Align Primary Keyword — Pick One
**Effort:** 30 min**

Currently inconsistent: "Senior Web UI Engineer" (title tag) vs "Senior Fullstack Engineer" (hero copy). Pick one and align title, H1, first 100 words of body, and meta description. "Senior Frontend Engineer" is likely higher-volume than "Web UI Engineer."

---

### M-5: Remove Dead/Noise Meta Tags
**Effort:** 5 min | **File:** `src/index.html`

Remove:
```html
<!-- Remove — ignored since 2007 -->
<meta name="revisit-after" content="7 days">

<!-- Trim to 5-8 unique terms or remove entirely -->
<meta name="keywords" content="...22 terms...">
```

---

### M-6: Fix Scroll Handlers → `IntersectionObserver`
**Effort:** 2-4 hours | **Impact:** INP improvement**

Replace scroll-driven animations with `IntersectionObserver` for element reveal. Any remaining scroll handlers should run outside Angular's zone:
```typescript
this.ngZone.runOutsideAngular(() => {
  window.addEventListener('scroll', handler, { passive: true });
});
```

---

## LOW (Backlog)

### L-1: Implement Angular SSR (Biggest Long-Term Win)
**Effort:** 1-3 days | **Impact:** Would push score from ~70 → ~85+**

```
ng add @angular/ssr
```

This single change fixes the root cause behind ~60% of all issues found in this audit:
- Makes all content visible to all crawlers without JS
- Makes per-route canonical, OG tags, and structured data correct in static HTML
- Makes blog posts indexable on Bing, DuckDuckGo, and AI crawlers
- Makes social share previews accurate per route
- Enables proper hreflang implementation with path-based i18n

---

### L-2: Create YouTube Video (AI Citation Signal)
**Effort:** 3-5 hours | **Impact:** GEO entity disambiguation**

Publish at least one technical video (project walkthrough, blog post explanation). YouTube has a ~0.737 correlation with AI search citation — the highest known signal for personal brand disambiguation.

---

### L-3: Migrate to Zoneless Angular
**Effort:** 1-2 days | **Impact:** INP improvement, -34KB JS**

After confirming all components use signals or `OnPush`:
1. Add `provideExperimentalZonelessChangeDetection()` to providers
2. Remove `zone.js` from `polyfills.ts`
3. Move scroll handlers outside Angular zone as needed

---

### L-4: Add IndexNow
**Effort:** 30 min | **Impact:** Faster Bing/Yandex indexing**

1. Generate key at [bing.com/indexnow](https://www.bing.com/indexnow)
2. Place `{key}.txt` in `public/`
3. Add `<meta name="indexnow-key" content="{key}">` to `index.html`
4. Call IndexNow API when publishing new blog posts

---

### L-5: Fix Semantic HTML Issues
**Effort:** 15 min**

- `src/app/components/hero/hero.html` line 44: Change `<nav>` wrapping email/LinkedIn/resume buttons to `<div>` — `<nav>` is for site navigation, not CTA link groups
- Standardize all `target="_blank"` links to use `rel="noopener noreferrer"` (currently inconsistent)

---

## Projected Score After Each Phase

| Phase | Actions | Projected Score |
|---|---|---|
| Baseline | Current state | **49/100** |
| After Critical fixes (C1-C7) | llms.txt, static JSON-LD, caching, schema fixes, sitemap | **~62/100** |
| After High fixes (H1-H9) | OG card, LCP preload, favicon, canonical, fonts, privacy, copy | **~72/100** |
| After Medium fixes (M1-M6) | Copy polish, certifications schema, scroll handlers | **~76/100** |
| After SSR (L-1) | All crawler barriers removed | **~85/100** |

---

## Quick Wins Summary (Do These First)

All of these can be done **today**, require no framework changes, and together push the score from 49 → ~62:

1. [ ] Create `public/llms.txt`
2. [ ] Add static JSON-LD `@graph` to `src/index.html`
3. [ ] Create `vercel.json` with immutable cache headers
4. [ ] Fix `addStructuredData()` to support multiple IDs
5. [ ] Add `publisher.logo` to BlogPosting schema
6. [ ] Add `image` to Person schema
7. [ ] Replace `public/sitemap.xml` with corrected version
8. [ ] Remove `<link rel="preconnect" href="https://images.unsplash.com">` (5 seconds)
9. [ ] Add `<link rel="apple-touch-icon">` and `<link rel="manifest">` to `index.html`
10. [ ] Add `<link rel="preload" as="image" href="/myphoto.webp" fetchpriority="high">` to `index.html`
