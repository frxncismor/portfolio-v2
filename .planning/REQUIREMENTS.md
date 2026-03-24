# Requirements

## SEO Improvements — Phase 1

### Technical SEO
- REQ-001: Add Angular SSR (`@angular/ssr`) so pages render HTML without JS execution, compatible with Vercel serverless deployment
- [x] REQ-002: Generate `robots.txt` and serve it from `/public/robots.txt` (completed: 01-01, commit 0d1fbb5)
- [x] REQ-003: Generate `sitemap.xml` at build time covering all routes (home, blog, blog posts, services, certifications, price-quote-generator) (completed: 01-01, commit 0d1fbb5)
- [x] REQ-004: Add `llms.txt` at `/public/llms.txt` for AI crawler readiness (completed: 01-01, commit 0d1fbb5)
- [x] REQ-005: Fix canonical URL — root `/` must not redirect to `/home`; canonical in `<head>` must be `https://frxncismor.dev/` (completed: 01-01, pre-existing fix verified)
- [x] REQ-006: Fix `og:url` inconsistency — remove `www.` prefix so all OG URLs use `https://frxncismor.dev` (no www) (completed: 01-01, pre-existing fix verified)

### Schema Markup
- [x] REQ-007: Add `EducationalOccupationalCredential` schema to certifications page (completed: 01-02, commit 1188c84)
- [x] REQ-008: Add `BlogPosting` schema with `datePublished`, `author`, `headline`, `image` to blog-detail page (completed: 01-02, pre-existing in blog-detail.ts)
- [x] REQ-009: Add `WebApplication` schema to price-quote-generator page (completed: 01-02, commit 7d50433)
- REQ-010: Add `Service` / `ProfessionalService` schema to services page

### Content
- REQ-011: Build out the empty services page with SEO-targeted content targeting keywords: "Angular developer Houston TX", "freelance frontend consultant", "hire Angular developer"
