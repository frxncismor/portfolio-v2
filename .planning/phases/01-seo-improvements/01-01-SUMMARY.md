---
phase: 01-seo-improvements
plan: "01"
subsystem: seo-static-files
tags: [seo, robots, sitemap, llms, canonical, og-tags]
dependency_graph:
  requires: []
  provides: [robots.txt, sitemap.xml, llms.txt, canonical-urls]
  affects: [search-engine-crawling, ai-crawling, url-canonicalization]
tech_stack:
  added: []
  patterns: [static-file-serving, xml-sitemap, robots-txt, llms-txt]
key_files:
  created:
    - public/llms.txt
  modified:
    - public/robots.txt
    - public/sitemap.xml
decisions:
  - "Use static sitemap.xml in public/ (not a build script) since routes are known"
  - "Exclude /blog/{slug} dynamic routes from static sitemap — covered by SSR in later plan"
  - "Remove xhtml:link hreflang alternates from sitemap — simplify to canonical URLs only"
metrics:
  duration: "1 minute"
  completed: "2026-03-23"
  tasks_completed: 2
  files_changed: 3
---

# Phase 01 Plan 01: Static SEO Files & URL Canonicalization Summary

**One-liner:** Clean robots.txt, simplified sitemap.xml with /services route, new llms.txt AI crawler entity description — all using https://frxncismor.dev/ (no www, no /home).

## Objective

Fix static SEO files and URL inconsistencies across the portfolio site so search engines can discover all pages and AI crawlers get structured entity info.

## What Was Done

### Task 1: Update static files (robots.txt, sitemap.xml, llms.txt)

Updated `public/robots.txt` to remove extra comments (`# Sitemap`, `# Disallow: /admin/`) leaving only clean directives per the SITE-STRUCTURE.md spec:
- `User-agent: *`
- `Allow: /`
- `Sitemap: https://frxncismor.dev/sitemap.xml`

Rewrote `public/sitemap.xml` to:
- Remove the duplicate `/home` entry (superseded by `/`)
- Remove xhtml:link hreflang alternate entries (simpler is better for static sitemap)
- Add missing `/services` route (priority 0.8)
- Adjust priorities: `/` 1.0, `/blog` 0.9, `/services` 0.8, `/certifications` 0.6, `/price-quote-generator` 0.5

Created `public/llms.txt` (did not previously exist) with Francisco Moreno entity description matching SITE-STRUCTURE.md spec: name, location, experience summary, specializations, and all key links.

**Commit:** 0d1fbb5

### Task 2: Fix canonical and OG URLs in index.html and seo.service.ts

Pre-existing state: All URL bugs described in the plan were already resolved in commit `feat(seo): improve SEO score and Core Web Vitals`. No code changes were needed.

Verified state:
- `src/index.html`: canonical, og:url, and twitter:url all use `https://frxncismor.dev/` (no www, no /home)
- `src/index.html`: og:image and twitter:image use `https://frxncismor.dev/myphoto.webp` (no www)
- `src/app/services/seo.service.ts`: uses `this.baseUrl` throughout; no `updateCanonical` method with hardcoded www exists

No commit needed for Task 2 (no changes required).

## Deviations from Plan

### Pre-existing Fix

**[Rule 1 - Already Fixed] Task 2 bugs were resolved prior to this plan execution**
- **Found during:** Task 2 verification
- **Issue:** Plan described www URLs and /home in index.html and a hardcoded www in seo.service.ts's `updateCanonical` method
- **Reality:** The prior commit `feat(seo): improve SEO score and Core Web Vitals` (23be7a1) had already resolved these issues. The `seo.service.ts` doesn't even have an `updateCanonical` method — it uses `this.baseUrl` directly in `updateSEO`.
- **Action:** No changes made; acceptance criteria verified as already passing
- **Files modified:** None

## Verification Results

All overall verification checks passed:
- `grep -r "www.frxncismor" src/` — 0 matches (no www references in src/)
- `grep "/home" public/sitemap.xml` — 0 matches (no /home in sitemap)
- Static files all exist and non-empty: robots.txt (4 lines), sitemap.xml (28 lines), llms.txt (12 lines)

## Known Stubs

None.

## Self-Check: PASSED

Files created/modified:
- public/robots.txt — FOUND
- public/sitemap.xml — FOUND
- public/llms.txt — FOUND

Commits:
- 0d1fbb5 — FOUND (chore(01-01): update static SEO files)
