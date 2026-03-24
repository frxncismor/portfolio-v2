---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Executing Phase 02
last_updated: "2026-03-24T04:38:00.000Z"
progress:
  total_phases: 2
  completed_phases: 1
  total_plans: 8
  completed_plans: 6
---

# Project State

## Project

**Name:** frxncismor Portfolio v2
**Repo:** https://github.com/frxncismor/portfolio-v2
**Live:** https://frxncismor.dev
**Owner:** Francisco Moreno

## Stack

- Angular SPA (standalone components, signals)
- TypeScript, TailwindCSS, PrimeNG
- Vercel deployment
- Bilingual i18n (en/es)
- Umami analytics
- Blog via service + HTTP

## Current Milestone

**SEO Improvements** — Improve organic visibility, fix technical SEO gaps, add Angular SSR

## Current Position

Phase: 02 (lighthouse-performance-100) — EXECUTING
Plan: 3 of 4

## Completed Plans

- [x] 01-01: Static SEO Files & URL Canonicalization (commit: 0d1fbb5)
- [x] 01-02: Structured Data — Certifications & Price-Quote Generator (commits: 1188c84, 7d50433)
- [x] 01-03: Angular SSR Configuration (commits: 044f31f, c80da72)
- [x] 01-04: Services Page with ProfessionalService Schema (commits: 40227d9, 9f037bf)
- [x] 02-01: Bundle Leak Fix — Dynamic Imports for marked, highlight.js, jspdf (commits: 0d419d5, 4989483)
- [x] 02-02: Self-Host Kedebideri Font (commits: 22b05e0, 1171498)

## Decisions Log

- 2026-03-23: Initiated SEO improvement milestone based on SEO audit (SEO-STRATEGY.md, COMPETITOR-ANALYSIS.md, SITE-STRUCTURE.md, IMPLEMENTATION-ROADMAP.md)
- 2026-03-23: All changes must remain compatible with Vercel deployment
- 2026-03-23: Work on branch `feat/seo-improvements`
- 2026-03-23: Angular SSR via `@angular/ssr` — Vercel auto-detects and deploys as serverless function
- 2026-03-23: Use static sitemap.xml in public/ (not a build script) since routes are known
- 2026-03-23: Remove xhtml:link hreflang alternates from sitemap — simplify to canonical URLs only
- 2026-03-23: REQ-008 (BlogPosting) confirmed already satisfied in blog-detail.ts — no changes needed
- 2026-03-23: WebApplication schema uses Offer with price '0' to represent the free price-quote tool
- 2026-03-23: Services page uses ProfessionalService schema with areaServed array (US + Texas) for local SEO targeting
- 2026-03-23: CTA conversion funnel: hero + CTA section both link to /price-quote-generator and Calendly
- 2026-03-23: CommonEngine must be imported from @angular/ssr/node in Angular 20 (not root @angular/ssr)
- 2026-03-23: addStructuredData and updateCanonical guarded with isPlatformBrowser; updateSEO uses SSR-safe Angular Meta/Title APIs
- 2026-03-23: 02-02: Self-hosted Kedebideri latin subset woff2 (400/600/700) — eliminates Google Fonts CDN; font-display: swap on all weights
- 2026-03-24: 02-01: Use ensureLibsLoaded() singleton for lazy-init of marked+highlight.js; use dynamic import('jspdf') at call site in generateQuotePDF()
