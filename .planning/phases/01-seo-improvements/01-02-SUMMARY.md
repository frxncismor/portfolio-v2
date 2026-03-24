---
phase: 01-seo-improvements
plan: 02
subsystem: seo/structured-data
tags: [schema.org, structured-data, certifications, price-quote, seo]
dependency_graph:
  requires: []
  provides: [REQ-007, REQ-009]
  affects: [certifications-page, price-quote-generator-page]
tech_stack:
  added: []
  patterns: [schema.org/EducationalOccupationalCredential, schema.org/WebApplication, schema.org/ItemList]
key_files:
  created: []
  modified:
    - src/app/pages/certifications/certifications.ts
    - src/app/pages/price-quote-generation/price-quote-generation.ts
decisions:
  - "REQ-008 (BlogPosting) confirmed already satisfied in blog-detail.ts — no changes needed"
  - "Used 'credentials' type key for certifications structured data to replace plain 'certifications' key, enabling per-cert credential schemas"
  - "WebApplication Offer price is '0' (free tool) with priceCurrency USD"
metrics:
  duration: "~2 minutes"
  completed: "2026-03-23"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 01 Plan 02: Structured Data for Certifications and Price Quote Generator Summary

**One-liner:** EducationalOccupationalCredential schema per cert in ItemList, WebApplication schema with Offer for free price-quote tool.

## What Was Built

Added schema.org structured data markup to two pages:

1. **Certifications page** — replaced plain `ItemList` schema with an `ItemList` wrapping per-cert `EducationalOccupationalCredential` items. Each credential includes `credentialCategory`, `recognizedBy` (Organization), `dateCreated`, `url`, `competencyRequired`, and `holder` (Person).

2. **Price-quote-generator page** — added new `WebApplication` schema call in `ngOnInit` with `applicationCategory: 'UtilityApplication'`, `operatingSystem: 'Web'`, bilingual `name`/`description` based on locale, and a free `Offer` (`price: '0'`).

Both schemas are injected via `seoService.addStructuredData()` with unique type keys (`'credentials'` and `'webapplication'`) to prevent duplicate script tags.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add EducationalOccupationalCredential schema to certifications page | `1188c84` | `src/app/pages/certifications/certifications.ts` |
| 2 | Add WebApplication schema to price-quote-generator page | `7d50433` | `src/app/pages/price-quote-generation/price-quote-generation.ts` |

## Requirements Satisfied

- **REQ-007:** Certifications page emits `EducationalOccupationalCredential` schema per cert item, wrapped in `ItemList` with `ListItem` position elements.
- **REQ-008:** Already satisfied in `blog-detail.ts` (BlogPosting schema) — confirmed, no work needed.
- **REQ-009:** Price-quote-generator page emits `WebApplication` schema with `applicationCategory`, `operatingSystem`, `offers`, and `author`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both schemas wire real data from i18n service and component signals. Certifications schema maps live `Certification[]` from `i18nService.getTranslationValue('certifications.items')`. Price-quote schema uses live `locale` from `i18nService.getLocale()`.

## Self-Check: PASSED

All files confirmed present. Both commits (`1188c84`, `7d50433`) verified in git log.
