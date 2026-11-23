---
title: "Angular 21 SSR, Fastify and Drizzle in One Monorepo"
description: "How Grim Builds is structured: a pnpm monorepo with Angular 21 prerendering, a Fastify API, Drizzle migrations, Docker Compose and shared domain code."
date: 2026-11-18
category: "Angular"
draft: false
---

# One Monorepo, Full Stack: Angular 21 SSR, Fastify, Drizzle and PostgreSQL in Docker

**TL;DR:** Grim Builds is a personal project I'm building: a site for build guides and tier lists. It's still in development, but the architecture has settled enough to write about. One pnpm monorepo holds an Angular 21 app, a Fastify 5 API and a shared `domain` package. PostgreSQL runs in Docker Compose, Drizzle owns the schema and migrations, and the types and validation rules are shared across the stack. The code below is simplified from the real repo.

## The Shape of the Repo

```text
grim-dawn-builds/
├── src/                  # Angular 21 app (SSR + prerender)
├── apps/
│   └── api/              # Fastify 5 API + Drizzle schema and migrations
├── packages/
│   └── domain/           # Zod schemas, vocabulary, content rules
├── infra/docker/         # compose.yaml (db, migrate, api)
├── content/              # fixtures used for local development
└── pnpm-workspace.yaml
```

The workspace file is short:

```yaml
packages:
  - packages/*
  - apps/*
```

The Angular app sits at the repository root, and the API and the shared package are workspace packages. Not a textbook layout (many tools prefer `apps/web`), but it works and it keeps the Angular CLI configuration simple.

## Why a Monorepo

I'm one developer. The question isn't "how do teams coordinate", it's "how do I avoid drift between the frontend and the backend".

The honest answer is **one place where the contract lives**. In a monorepo I change a type, the API breaks at compile time, the app breaks at compile time, and I fix both in one commit. With two repos, I'd publish a package, bump versions and discover the mismatch in production.

The tradeoffs are real:

- CI has to be smart enough not to rebuild everything for a README change
- Tooling gets heavier (one lockfile, workspace filters, build order)
- The Docker build context is the whole repo, so images need careful layering

For a solo project with a shared contract, I'd take that trade every time.

## The Shared Domain Package

`packages/domain` is the center of the design. It's pure TypeScript: Zod schemas, vocabulary constants and content rules. No Angular, no Fastify, no I/O. Its `package.json` says exactly what it is:

```json
{
  "name": "@gd/domain",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/src/index.d.ts",
      "default": "./dist/src/index.js"
    },
    "./vocabulary": {
      "types": "./dist/src/vocabulary.d.ts",
      "default": "./dist/src/vocabulary.js"
    }
  }
}
```

A simplified schema looks like this:

```ts
import { z } from 'zod';

export const TIERS = ['S', 'A', 'B', 'C'] as const;

export const PublicBuildSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  tier: z.enum(TIERS),
});

export type PublicBuild = z.infer<typeof PublicBuildSchema>;
```

One schema, three jobs:

1. **Types** for the Angular app (`PublicBuild`)
2. **Runtime validation** in the API, before data leaves the server
3. **Vocabulary** (like `TIERS`) reused by the database schema, with tests that fail if the two drift

The frontend never trusts the API blindly, and the API never invents a shape the frontend doesn't know. Both import the same definition.

## Angular 21: Prerendered, Hydrated, Replayable

The app uses Angular's SSR tooling, and in this project the build output mode is `static`: pages are prerendered at build time instead of rendered per request by a Node server. For a content site that's what I want. HTML arrives instantly, search engines see real content, and hosting is just static files.

Dynamic routes are prerendered by telling Angular which parameters exist:

```ts
export const serverRoutes: ServerRoute[] = [
  {
    path: 'builds/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.None,
    async getPrerenderParams() {
      const repository = inject(CONTENT_REPOSITORY);
      return (await repository.listSlugs()).map((slug) => ({ slug }));
    },
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
```

On the client, hydration takes over the server-rendered DOM instead of rebuilding it, and event replay makes sure clicks made before hydration finishes aren't lost:

```ts
provideClientHydration(withEventReplay())
```

The content access sits behind an interface, `ContentRepository`, provided through an injection token. There's one implementation that reads local fixtures and another that talks to the API. The components don't know which one they got, which keeps the app testable and lets me develop the UI without the backend running.

## Fastify as the API

The API is deliberately small: Fastify 5, read-only content endpoints and a health check. No auth or public writes yet, and I prefer to say that out loud instead of pretending. A route validates its input and its output with the domain schemas:

```ts
app.get('/builds/:slug', async (request, reply) => {
  const parsed = PublicBuildSchema.shape.slug.safeParse(
    (request.params as { slug?: unknown }).slug,
  );
  if (!parsed.success) return reply.code(400).send({ error: 'invalid_slug' });

  const build = await repository.findBuild(parsed.data);
  if (!build) return reply.code(404).send({ error: 'not_found' });

  return PublicBuildSchema.parse(build);
});
```

Parsing the *output* too is a habit worth stealing. It guarantees that a database column that shouldn't be public can't leak just because someone added it to a query. Logging redacts sensitive fields (authorization headers, cookies, anything named `token` or `secret`) so that logs are safe to read.

## Drizzle: The Schema in TypeScript, Migrations in SQL

I picked Drizzle because the schema is plain TypeScript and the SQL stays visible. No magic client generated from a separate language:

```ts
import { pgEnum, pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { TIERS } from '@gd/domain/vocabulary';

export const tierEnum = pgEnum('tier', TIERS);

export const builds = pgTable('builds', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  tier: tierEnum('tier').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

Notice `TIERS` comes from the domain package. The database enum and the Zod enum cannot disagree without a test failing.

Migrations come from `drizzle-kit generate`, which produces versioned SQL files, committed to the repo. A separate one-shot script applies them. The key design choice: **the API never migrates by itself.** Migration is its own step with its own database role. Running it twice applies nothing new, and it takes an advisory lock so two migrators can't race.

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:check": "drizzle-kit check",
    "db:migrate": "node dist/db/migrate.mjs"
  }
}
```

## PostgreSQL and Docker Compose

Local infrastructure is a Compose stack with three services, in dependency order:

```yaml
services:
  db:
    image: postgres:17.11-trixie   # pinned, never `latest`
    healthcheck: { ... }
  migrate:
    command: ["node", "dist/db/migrate.mjs"]
    depends_on:
      db: { condition: service_healthy }
  api:
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      migrate: { condition: service_completed_successfully }
```

The ideas I care about, more than the YAML:

- **Pinned images.** A moving tag is a surprise waiting to happen.
- **The database is not published to the host.** Debug access is opt-in through a separate override file.
- **The API only listens on loopback** locally.
- **Order is enforced**: database healthy, then migrations, then API.
- **Credentials come from secret files, not from the repo**, and different roles do different jobs (one to migrate, a restricted read-only one for the API).

It's more hardening than a hobby project strictly needs. I did it on purpose: the habits are what I want to practice.

## What I'd Warn You About

- **pnpm workspaces and Docker.** You must copy manifests first for layer caching and use `pnpm deploy` to build a production tree. It's fiddly the first time.
- **Build order.** The domain package must be built before its consumers; scripts have to say so explicitly.
- **Two runtimes, two module systems.** Angular's toolchain and a Node ESM API have different expectations. Keep the shared package boring: plain TS, no framework imports.
- **SSR and the repository abstraction.** Anything touched during prerender must work on the server. Browser-only APIs need guarding.
- **It's in development.** Some of what I described is the intended design, and parts of the API are intentionally minimal today.

## Key Takeaways

- A monorepo's real benefit is one contract: change it once, let the compiler find every consumer.
- Put schemas and vocabulary in a framework-free shared package, and reuse them for types, validation and database enums.
- For a content site, static prerendering plus hydration gives you speed and SEO without running a server.
- Validate API input *and* output with the same schema.
- Keep migrations a separate, explicit step; the API shouldn't change the database on boot.
- Compose is a great place to practice production habits: pinned images, private networks, health-gated startup.

## Further Reading

- [Angular: Server and hybrid rendering](https://angular.dev/guide/ssr)
- [Angular: Hydration](https://angular.dev/guide/hydration)
- [Fastify documentation](https://fastify.dev/docs/latest/)
- [Drizzle ORM: PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-new)
- [Drizzle Kit: migrations](https://orm.drizzle.team/docs/kit-overview)
- [pnpm workspaces](https://pnpm.io/workspaces)
- [Docker Compose: startup order](https://docs.docker.com/compose/how-tos/startup-order/)
- [Zod](https://zod.dev/)
