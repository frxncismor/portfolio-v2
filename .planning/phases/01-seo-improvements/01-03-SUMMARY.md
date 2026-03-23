---
phase: 01-seo-improvements
plan: 03
subsystem: ssr
tags: [angular-ssr, seo, server-side-rendering, platform-browser]
dependency_graph:
  requires: [01-01, 01-02]
  provides: [angular-ssr-config, ssr-safe-seo-service]
  affects: [angular.json, src/server.ts, src/app/app.config.server.ts, src/main.server.ts, src/app/services/seo.service.ts]
tech_stack:
  added: ["@angular/ssr@20.3.21", "@angular/platform-server@20.3.x", "express", "@types/express", "@types/node"]
  patterns: ["CommonEngine SSR", "isPlatformBrowser guard", "mergeApplicationConfig server config"]
key_files:
  created:
    - src/server.ts
    - src/app/app.config.server.ts
    - src/main.server.ts
  modified:
    - angular.json
    - package.json
    - src/app/services/seo.service.ts
decisions:
  - "Import CommonEngine from @angular/ssr/node (not @angular/ssr) in Angular 20"
  - "Use require() with type assertion for express to avoid ESM default import error"
  - "prerender: false ensures dynamic SSR for all routes including blog/:slug"
  - "updateCanonical and addStructuredData guarded; updateSEO not guarded (uses Angular Meta/Title SSR-safe APIs)"
  - "addStructuredData now accepts optional type parameter for per-type script IDs"
metrics:
  duration_minutes: 15
  completed_date: "2026-03-23"
  tasks_completed: 2
  files_modified: 6
---

# Phase 01 Plan 03: Angular SSR Configuration Summary

**One-liner:** Angular SSR configured via @angular/ssr with CommonEngine, Express server entry, and isPlatformBrowser guards on DOM-manipulating SEO service methods.

## What Was Built

Angular Server-Side Rendering (SSR) was added to the portfolio using `@angular/ssr`. The Angular build now produces both `browser/` and `server/` output directories. The SSR configuration uses `CommonEngine` with an Express server. The `seo.service.ts` DOM operations are guarded with `isPlatformBrowser` to prevent crashes during server-side rendering.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Configure Angular SSR with @angular/ssr | 044f31f | src/server.ts, src/app/app.config.server.ts, src/main.server.ts, angular.json, package.json |
| 2 | Add isPlatformBrowser guards to seo.service.ts | c80da72 | src/app/services/seo.service.ts |

## Verification Results

- `ng build` completes without errors, producing browser/ and server/ output
- `dist/frxncismor-portfolio/server/` contains server bundle (server.mjs, main.server.mjs, etc.)
- `dist/frxncismor-portfolio/browser/` contains client assets
- `grep "isPlatformBrowser" src/app/services/seo.service.ts` returns 3 matches (import + 2 guards)
- `grep "CommonEngine" src/server.ts` confirms SSR engine is configured
- `updateSEO` method does NOT contain `isPlatformBrowser` (uses SSR-safe Angular APIs)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CommonEngine moved to @angular/ssr/node in Angular 20**
- **Found during:** Task 1 — build error TS2305
- **Issue:** Angular 20's `@angular/ssr` exports `CommonEngine` from the `node` subpath, not the root package
- **Fix:** Changed import to `import { CommonEngine } from '@angular/ssr/node'`
- **Files modified:** src/server.ts
- **Commit:** 044f31f

**2. [Rule 3 - Blocking] Missing @angular/platform-server, express, @types packages**
- **Found during:** Task 1 — build errors TS2307, TS7016
- **Issue:** `@angular/ssr` requires `@angular/platform-server` as a peer dep, and `server.ts` needs express types and node types
- **Fix:** Installed `@angular/platform-server@^20.3.0`, `express`, `@types/express`, `@types/node` with `--legacy-peer-deps`
- **Files modified:** package.json, package-lock.json
- **Commit:** 044f31f

**3. [Rule 3 - Blocking] express ESM default import incompatibility**
- **Found during:** Task 1 — build warning about import namespace
- **Issue:** Express uses CommonJS `export =` syntax which requires `esModuleInterop` for default imports; Angular's strict build blocks this
- **Fix:** Used `const express: any = require('express')` with Application type annotation from `@types/express`
- **Files modified:** src/server.ts
- **Commit:** 044f31f

**4. [Rule 2 - Missing Critical] addStructuredData type parameter and updateCanonical method**
- **Found during:** Task 2 review of seo.service.ts
- **Issue:** Current `seo.service.ts` lacked the `type` parameter on `addStructuredData` (needed by plans 01-01/01-02) and had no `updateCanonical` method
- **Fix:** Added both as part of the SSR guard task, since they were dependencies of this plan's output
- **Files modified:** src/app/services/seo.service.ts
- **Commit:** c80da72

## Known Stubs

None — all functionality is fully implemented.

## Self-Check: PASSED
