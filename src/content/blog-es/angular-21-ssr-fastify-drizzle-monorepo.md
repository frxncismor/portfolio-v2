---
title: "Angular 21 SSR, Fastify, Drizzle y Postgres en un Monorepo"
description: "Cómo está armado Grim Builds: monorepo con pnpm, Angular 21 con prerender, API en Fastify, migraciones con Drizzle, Docker Compose y dominio compartido."
date: 2026-11-18
category: "Angular"
cover: "monorepo"
draft: false
---

# Un Monorepo, Full Stack: Angular 21 SSR, Fastify, Drizzle y PostgreSQL en Docker

**TL;DR:** Grim Builds es un proyecto personal que estoy construyendo: un sitio de guías de builds y tier lists. Sigue en desarrollo, pero la arquitectura ya se asentó lo suficiente para escribir sobre ella. Un monorepo con pnpm contiene una app de Angular 21, una API en Fastify 5 y un paquete compartido `domain`. PostgreSQL corre en Docker Compose, Drizzle es dueño del schema y las migraciones, y los tipos y las reglas de validación se comparten en todo el stack. El código de abajo está simplificado del repo real.

## La Forma del Repo

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

El archivo del workspace es corto:

```yaml
packages:
  - packages/*
  - apps/*
```

La app de Angular vive en la raíz del repositorio, y la API y el paquete compartido son paquetes del workspace. No es un layout de libro de texto (muchas herramientas prefieren `apps/web`), pero funciona y mantiene simple la configuración del Angular CLI.

## Por Qué un Monorepo

Soy un solo desarrollador. La pregunta no es "cómo se coordinan los equipos", sino "cómo evito que el frontend y el backend se desfasen".

La respuesta honesta es **un solo lugar donde vive el contrato**. En un monorepo cambio un tipo, la API rompe en compilación, la app rompe en compilación, y arreglo las dos en un commit. Con dos repos, publicaría un paquete, subiría versiones y descubriría el desajuste en producción.

Los tradeoffs son reales:

- CI tiene que ser lo bastante inteligente para no reconstruir todo por un cambio en el README
- Las herramientas pesan más (un lockfile, filtros del workspace, orden de build)
- El contexto de build de Docker es todo el repo, así que las imágenes necesitan capas bien pensadas

Para un proyecto solo con un contrato compartido, tomaría ese trato siempre.

## El Paquete de Dominio Compartido

`packages/domain` es el centro del diseño. Es TypeScript puro: schemas de Zod, constantes de vocabulario y reglas de contenido. Sin Angular, sin Fastify, sin I/O. Su `package.json` dice exactamente lo que es:

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

Un schema simplificado se ve así:

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

Un schema, tres trabajos:

1. **Tipos** para la app de Angular (`PublicBuild`)
2. **Validación en runtime** en la API, antes de que los datos salgan del servidor
3. **Vocabulario** (como `TIERS`) reutilizado por el schema de la base de datos, con pruebas que fallan si los dos se desfasan

El frontend nunca confía ciegamente en la API, y la API nunca inventa una forma que el frontend no conoce. Los dos importan la misma definición.

## Angular 21: Prerender, Hidratación y Event Replay

La app usa las herramientas de SSR de Angular, y en este proyecto el modo de salida del build es `static`: las páginas se prerenderizan en build en lugar de renderizarse por petición en un servidor Node. Para un sitio de contenido es lo que quiero. El HTML llega al instante, los buscadores ven contenido real y el hosting son solo archivos estáticos.

Las rutas dinámicas se prerenderizan diciéndole a Angular qué parámetros existen:

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

En el cliente, la hidratación toma el control del DOM renderizado en servidor en lugar de reconstruirlo, y el event replay se asegura de que los clics hechos antes de que termine la hidratación no se pierdan:

```ts
provideClientHydration(withEventReplay())
```

El acceso al contenido está detrás de una interfaz, `ContentRepository`, provista mediante un injection token. Hay una implementación que lee fixtures locales y otra que habla con la API. Los componentes no saben cuál recibieron, lo que mantiene la app testeable y me deja desarrollar la UI sin tener el backend corriendo.

## Fastify como API

La API es deliberadamente pequeña: Fastify 5, endpoints de contenido de solo lectura y un health check. Todavía sin autenticación ni escrituras públicas, y prefiero decirlo en voz alta en vez de fingir. Una ruta valida su entrada y su salida con los schemas del dominio:

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

Parsear también la *salida* es un hábito que vale la pena robar. Garantiza que una columna de la base de datos que no debería ser pública no pueda filtrarse solo porque alguien la agregó a un query. El logging censura los campos sensibles (headers de autorización, cookies, cualquier cosa llamada `token` o `secret`) para que los logs sean seguros de leer.

## Drizzle: el Schema en TypeScript, las Migraciones en SQL

Elegí Drizzle porque el schema es TypeScript normal y el SQL se queda visible. Sin un cliente mágico generado desde otro lenguaje:

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

Fíjate que `TIERS` viene del paquete de dominio. El enum de la base de datos y el enum de Zod no pueden discrepar sin que falle una prueba.

Las migraciones salen de `drizzle-kit generate`, que produce archivos SQL versionados, commiteados al repo. Un script aparte de una sola corrida las aplica. La decisión clave de diseño: **la API nunca migra por sí sola.** La migración es su propio paso con su propio rol de base de datos. Correrla dos veces no aplica nada nuevo, y toma un advisory lock para que dos migradores no compitan.

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:check": "drizzle-kit check",
    "db:migrate": "node dist/db/migrate.mjs"
  }
}
```

## PostgreSQL y Docker Compose

La infraestructura local es un stack de Compose con tres servicios, en orden de dependencia:

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

Las ideas que me importan, más que el YAML:

- **Imágenes fijadas.** Un tag que se mueve es una sorpresa esperando a pasar.
- **La base de datos no se publica al host.** El acceso para debug es opcional mediante un archivo de override aparte.
- **La API solo escucha en loopback** en local.
- **El orden se aplica**: base de datos sana, luego migraciones, luego API.
- **Las credenciales vienen de archivos de secretos, no del repo**, y roles distintos hacen trabajos distintos (uno para migrar, uno restringido de solo lectura para la API).

Es más hardening del que un proyecto personal necesita estrictamente. Lo hice a propósito: los hábitos son lo que quiero practicar.

## De Qué Te Advertiría

- **Workspaces de pnpm y Docker.** Hay que copiar primero los manifiestos para el cache de capas y usar `pnpm deploy` para armar un árbol de producción. La primera vez es delicado.
- **Orden de build.** El paquete de dominio debe construirse antes que sus consumidores; los scripts tienen que decirlo explícitamente.
- **Dos runtimes, dos sistemas de módulos.** El toolchain de Angular y una API Node ESM tienen expectativas distintas. Mantén aburrido el paquete compartido: TS plano, sin imports de frameworks.
- **SSR y la abstracción del repositorio.** Todo lo que se toque durante el prerender debe funcionar en el servidor. Las APIs exclusivas del navegador hay que protegerlas.
- **Está en desarrollo.** Parte de lo que describí es el diseño previsto, y partes de la API son intencionalmente mínimas hoy.

## Puntos Clave

- El beneficio real de un monorepo es un solo contrato: lo cambias una vez y el compilador encuentra a todos los consumidores.
- Pon schemas y vocabulario en un paquete compartido sin frameworks, y reutilízalos para tipos, validación y enums de base de datos.
- Para un sitio de contenido, el prerender estático más la hidratación te da velocidad y SEO sin correr un servidor.
- Valida la entrada *y* la salida de la API con el mismo schema.
- Mantén las migraciones como un paso separado y explícito; la API no debería cambiar la base de datos al arrancar.
- Compose es un gran lugar para practicar hábitos de producción: imágenes fijadas, redes privadas, arranque condicionado a health checks.

## Lecturas Recomendadas

- [Angular: Server and hybrid rendering](https://angular.dev/guide/ssr)
- [Angular: Hydration](https://angular.dev/guide/hydration)
- [Fastify documentation](https://fastify.dev/docs/latest/)
- [Drizzle ORM: PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-new)
- [Drizzle Kit: migrations](https://orm.drizzle.team/docs/kit-overview)
- [pnpm workspaces](https://pnpm.io/workspaces)
- [Docker Compose: startup order](https://docs.docker.com/compose/how-tos/startup-order/)
- [Zod](https://zod.dev/)
