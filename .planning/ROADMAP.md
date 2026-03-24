# Roadmap

## Milestone 1: SEO Improvements

**Goal:** Improve organic search visibility of frxncismor.dev by fixing critical technical SEO gaps, adding missing schema markup, and building out content pages. All changes must be compatible with Vercel deployment.

---

### Phase 1: SEO Improvements
**Goal:** Make frxncismor.dev fully crawlable, properly indexed, and schema-complete, with Angular SSR for server-side rendering compatible with Vercel.

**Requirements:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011

**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Static files (robots.txt, sitemap.xml, llms.txt) and canonical/OG URL fixes
- [x] 01-02-PLAN.md — Schema enhancements (EducationalOccupationalCredential + WebApplication)
- [x] 01-03-PLAN.md — Angular SSR setup (@angular/ssr) with browser guards
- [x] 01-04-PLAN.md — Services page content, i18n, route, and ProfessionalService schema

**Deliverables:**
- Angular SSR configured and working on Vercel
- `robots.txt`, `sitemap.xml`, `llms.txt` in `/public`
- Canonical and OG URL inconsistencies fixed
- Schema markup on certifications, blog-detail, price-quote-generator, and services pages
- Services page with real SEO-targeted content

---

### Phase 2: Lighthouse Performance 100
**Goal:** Raise Lighthouse performance score from 87 to 100 on frxncismor.dev by addressing all Core Web Vitals and performance audit items. SEO score is already 100 — must not regress.

**Requirements:** REQ-PERF-001

**Plans:** TBD

**Deliverables:**
- Lighthouse performance score of 100
- No regression in SEO (100), Accessibility, or Best Practices scores
- All Core Web Vitals in green (LCP, FID/INP, CLS)
- Changes compatible with Vercel deployment and Angular SSR
