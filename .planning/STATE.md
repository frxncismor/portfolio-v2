---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Ready to execute
stopped_at: Completed 01-04-PLAN.md (Services Page)
last_updated: "2026-03-23T23:50:43.938Z"
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 4
  completed_plans: 3
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

**Phase:** 01-seo-improvements
**Plan:** 3 of 4 (COMPLETE)
**Stopped At:** Completed 01-04-PLAN.md (Services Page)
**Last Session:** 2026-03-23T23:50:43.935Z

## Completed Plans

- [x] 01-01: Static SEO Files & URL Canonicalization (commit: 0d1fbb5)
- [x] 01-02: Structured Data — Certifications & Price-Quote Generator (commits: 1188c84, 7d50433)
- [x] 01-04: Services Page with ProfessionalService Schema (commits: 40227d9, 9f037bf)

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
