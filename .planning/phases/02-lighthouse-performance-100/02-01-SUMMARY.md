---
phase: 02-lighthouse-performance-100
plan: "01"
subsystem: bundle-optimization
tags: [performance, dynamic-import, lazy-loading, bundle-size, angular]
dependency_graph:
  requires: []
  provides: [lazy-loaded-marked, lazy-loaded-highlight-js, lazy-loaded-jspdf]
  affects: [blog.service.ts, pdf-generator.service.ts, price-quote-generation.ts]
tech_stack:
  added: []
  patterns: [dynamic-import, lazy-init-singleton, async-service-method, switchMap-async]
key_files:
  created: []
  modified:
    - src/app/services/blog.service.ts
    - src/app/services/pdf-generator.service.ts
    - src/app/pages/price-quote-generation/price-quote-generation.ts
decisions:
  - "Use ensureLibsLoaded() singleton pattern in blog.service.ts to lazily initialize marked + highlight.js once and cache instances"
  - "Use switchMap(async ...) in loadPost() to integrate async dynamic import with RxJS pipeline"
  - "Make generateQuotePDF() async and add dynamic import('jspdf') at call site; cascade async/await to caller"
metrics:
  duration_minutes: 5
  tasks_completed: 2
  files_modified: 3
  completed_date: "2026-03-24"
---

# Phase 02 Plan 01: Bundle Leak Fix — Dynamic Imports for marked, highlight.js, jspdf Summary

Dynamic import conversion for three heavy libraries (marked, highlight.js, jspdf) — moves ~300kB+ from initial bundle to lazy chunks, reducing TBT and improving Lighthouse performance score.

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Convert blog.service.ts to dynamic imports for marked and highlight.js | Done | 0d419d5 |
| 2 | Convert pdf-generator.service.ts to dynamic import for jspdf | Done | 4989483 |

## What Was Built

### Task 1 — blog.service.ts dynamic imports

Replaced static top-level imports of `marked` and `highlight.js` with a lazy-init singleton pattern:

- Removed `import { marked, Renderer } from 'marked'` and `import hljs from 'highlight.js'`
- Added `private markedInstance` and `private hljsInstance` fields (null until first use)
- Added `ensureLibsLoaded()` async method that uses `Promise.all([import('marked'), import('highlight.js')])` — runs once on first blog post load, caches instances
- Moved renderer configuration and `marked.setOptions()` call into `ensureLibsLoaded()`
- Emptied constructor (renderer setup removed)
- Refactored `loadPost()` map operator to `switchMap(async (markdown) => { ... })` to await `ensureLibsLoaded()`

### Task 2 — pdf-generator.service.ts dynamic import

Replaced static `import jsPDF from 'jspdf'` with call-site dynamic import:

- Removed static import
- Changed `generateQuotePDF(data)` signature from `void` to `async generateQuotePDF(data): Promise<void>`
- Added `const { default: jsPDF } = await import('jspdf')` as first line of method body
- Updated caller `generatePDF()` in `price-quote-generation.ts` to `async generatePDF(): Promise<void>` with `await`

## Build Output Confirmation

Build output confirms libraries are now in **Lazy chunk files**, not Initial:

```
Initial total: 671.78 kB raw | 157.56 kB transfer

Lazy chunk files:
  chunk-OU6GO5BO.js  | index (highlight.js)   | 1.08 MB
  chunk-VSGDLJJS.js  | jspdf-es-min           | 410.17 kB
  chunk-4BHQC57T.js  | marked-esm             | 40.29 kB
```

All three libraries confirmed absent from initial bundle.

## Deviations from Plan

None — plan executed exactly as written. The `from` import was added to the RxJS import line but was not used in the final implementation (switchMap handles async natively); this caused no issues.

## Known Stubs

None.

## Self-Check

- [x] `src/app/services/blog.service.ts` — modified, committed at 0d419d5
- [x] `src/app/services/pdf-generator.service.ts` — modified, committed at 4989483
- [x] `src/app/pages/price-quote-generation/price-quote-generation.ts` — modified, committed at 4989483
- [x] Build succeeds with no errors
- [x] marked, highlight.js, jspdf all appear as lazy chunks in build output
