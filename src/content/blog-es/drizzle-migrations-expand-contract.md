---
title: "Migraciones con Drizzle: expandir, migrar, contraer"
description: "Cómo corro migraciones de Drizzle en producción: SQL versionado, diff revisado, expandir/contraer sin downtime, migrador one-shot con lock y un check en CI."
date: 2026-12-14
category: "Backend"
draft: false
---

# Migraciones con Drizzle sin miedo: expandir, migrar, contraer

**TL;DR:** Drizzle hace muy fácil escribir cambios de schema, y por eso mismo es fácil equivocarse. Mis reglas: a producción solo llega SQL versionado (`drizzle-kit generate`, nunca `push`), leo cada archivo generado antes de hacer commit, los cambios riesgosos se parten en expandir, migrar y contraer en despliegues separados, el migrador es un proceso one-shot que toma un advisory lock, y el CI falla si el schema y las migraciones no coinciden. Esto amplía la sección de Drizzle de [mi post del monorepo](/es/blog/angular-21-ssr-fastify-drizzle-monorepo/). Los ejemplos usan una tabla `products` inventada.

## generate vs push: elige uno para producción

`drizzle-kit` tiene dos formas de llevar tu schema de TypeScript a una base de datos, y no son intercambiables.

| Comando | Qué hace | Dónde lo uso |
|---|---|---|
| `drizzle-kit generate` | Compara tu schema con los snapshots anteriores y escribe archivos de migración SQL | Siempre: es la fuente de verdad |
| `drizzle-kit migrate` | Aplica los archivos SQL pendientes y los registra en una tabla de historial | Bases locales y de CI |
| `drizzle-kit push` | Compara el schema con la base viva y lo aplica directo, sin archivos | Solo prototipos desechables |
| `drizzle-kit check` | Revisa la consistencia del historial de migraciones | CI |

La documentación presenta `push` como algo pensado para prototipado rápido, y trae un flag `--explain` que imprime el SQL planeado sin aplicarlo y un `--force` que acepta automáticamente las sentencias que pierden datos. Ese es mi problema: con `push`, el cambio que llega a la base nunca es un artefacto revisado. No hay archivo que leer en un pull request, no hay historial, y no hay forma de repetir el mismo cambio en staging primero.

Con `generate` el cambio es un archivo SQL en git. Se revisa, corre una vez por ambiente y la base de datos recuerda que ya lo corrió (las migraciones aplicadas se registran en una tabla `__drizzle_migrations`, en el schema `drizzle` por defecto).

Una config mínima:

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

Una nota de versión. Cuando escribí esto, la documentación de Drizzle describe el release candidate de la 1.0, donde cada migración es una carpeta con `migration.sql` y `snapshot.json`. La línea estable 0.x todavía escribe archivos `.sql` planos más un `meta/_journal.json`. Los comandos de este post son los mismos en ambas, pero revisa qué estructura genera tu versión instalada antes de copiar rutas a un script.

## Lee el SQL generado

`drizzle-kit generate` solo conoce el antes y el después de tu schema. No sabe qué querías hacer. Por eso trato el archivo generado como un diff que hay que revisar, y busco siempre lo mismo:

- **Renombres.** Si renombras una columna en TypeScript, la herramienta no distingue un rename de un drop más un add. Te pregunta de forma interactiva si una columna fue renombrada o creada. En una shell no interactiva ese prompt es un problema, así que hazlo en local y lee el resultado: una respuesta equivocada significa `DROP COLUMN` seguido de `ADD COLUMN`, es decir, pérdida de datos.
- **`NOT NULL` sin default** en una tabla que ya tiene filas. Falla en el primer despliegue.
- **Defaults.** Un `defaultNow()` en TypeScript se vuelve un default de SQL; un valor que calculas en el código de la aplicación no existe en la base de datos.
- **Índices.** En una tabla grande, un `CREATE INDEX` normal bloquea las escrituras mientras se construye. Revisa qué se generó y, en tablas grandes, decide a propósito cómo se construye el índice (PostgreSQL tiene `CREATE INDEX CONCURRENTLY`, que tiene sus propias restricciones, así que pruébalo en tu setup antes de depender de él).

Cuando el SQL generado no es lo que quiero, no peleo con el generador. Creo una migración vacía y escribo el SQL a mano:

```bash
drizzle-kit generate --custom --name=backfill-product-name
```

Eso produce una migración nueva con un `migration.sql` vacío que Drizzle aplica como cualquier otra. Es la herramienta correcta para backfills y para todo lo que el diff no puede expresar.

## Expandir, migrar, contraer

Una migración correcta por sí sola aún puede tirar el sitio. La causa habitual es que el schema y el código se despliegan en momentos distintos. Durante unos segundos (o más, en un despliegue gradual) el código viejo corre contra el schema nuevo, o el código nuevo contra el schema viejo.

La solución es no enviar nunca un cambio que rompe en un solo paso. Tomemos un rename: `products.title` pasa a ser `products.name`. La versión de una línea es `ALTER TABLE ... RENAME COLUMN`, y rompe a toda instancia en ejecución que todavía lee `title`. En cambio uso tres despliegues.

**1. Expandir.** Agrega lo nuevo junto a lo viejo, sin quitar nada.

```ts
// schema.ts
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),   // old
  name: text('name'),               // new, nullable for now
});
```

```sql
ALTER TABLE "products" ADD COLUMN "name" text;
```

La app ahora escribe en ambas columnas y lee `name ?? title`. Las instancias viejas ignoran la columna nueva, así que la migración es segura de correr antes de que el código nuevo esté en vivo.

**2. Migrar.** Mueve los datos y luego cambia las lecturas. El backfill es una migración custom:

```sql
UPDATE "products" SET "name" = "title" WHERE "name" IS NULL;
```

En una tabla grande, córrelo por lotes desde un script en lugar de una sola sentencia, para no mantener un lock largo. Cuando todas las filas tienen valor, agrego la restricción en su propia migración:

```sql
ALTER TABLE "products" ALTER COLUMN "name" SET NOT NULL;
```

Después despliego código que lee solo `name`.

**3. Contraer.** Cuando ninguna versión en ejecución toca `title`, elimínala:

```sql
ALTER TABLE "products" DROP COLUMN "title";
```

El beneficio real es el rollback. Hasta el paso 3, volver atrás es solo redesplegar el código anterior, porque no se quitó nada. El paso destructivo es el último, pequeño y separado, y solo ocurre después de haber visto correr el código nuevo.

Es más lento que un solo rename. Para una tabla de la que nadie depende todavía, un paso basta. El patrón es para las tablas donde un despliegue fallido te cuesta algo.

## Un migrador one-shot con advisory lock

Mantengo las migraciones fuera del proceso de la API. La API no debería cambiar la base de datos al arrancar, y dos réplicas que arrancan juntas no deberían intentarlo las dos. Como describo en el [post del monorepo](/es/blog/angular-21-ssr-fastify-drizzle-monorepo/), el migrador es un contenedor one-shot aparte que corre, aplica lo pendiente y sale; Compose arranca la API solo cuando termina con éxito.

La API programática es `migrate()` del módulo migrator del driver. Para node-postgres:

```ts
// src/db/migrate.ts
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const LOCK_KEY = 727_001; // any constant shared by all migrators of this database

const client = new Client({ connectionString: process.env.MIGRATOR_DATABASE_URL });
await client.connect();

try {
  // Session-level lock: a second migrator waits here until the first finishes.
  await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);

  const db = drizzle({ client });
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('migrations applied');
} finally {
  await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => {});
  await client.end();
}
```

Detalles que importan:

- `pg_advisory_lock` es un lock **a nivel de sesión**, así que el lock y la migración deben usar la misma conexión. Por eso paso un solo `Client` y no un `Pool`, donde cada query podría caer en una conexión distinta.
- La clave del lock es un entero arbitrario. Todo proceso que migre esta base debe usar la misma.
- `migrationsFolder` apunta a la carpeta donde escribió `drizzle-kit generate` (el `out` de la config), así que los archivos de migración deben estar dentro de la imagen del migrador.
- El migrador se conecta con su propio rol, el único con permiso para DDL. El rol de la API no debería tenerlo.
- El proceso sale con código distinto de cero si falla (un rechazo no manejado en Node lo hace), y eso es lo que evita que Compose arranque la API.

En local uso `drizzle-kit migrate`, que lee los mismos archivos y la misma tabla de historial. En un ambiente desplegado uso el script, para que el camino de código que pruebo sea el que se ejecuta.

## Los seeds fuera de las migraciones

Una migración describe cómo cambia el schema. Los datos de prueba y el contenido de demo no van ahí, porque las migraciones corren en producción exactamente una vez y para siempre.

- **Datos de referencia que la app necesita para funcionar** (roles, una lista fija de categorías) pueden ir en una migración custom, escrita para ser idempotente con `INSERT ... ON CONFLICT DO NOTHING`.
- **Todo lo demás** va en un script aparte, `src/db/seed.ts`, que se niega a correr si el ambiente no es local o de pruebas.

```bash
node --env-file=.env.local dist/db/seed.js
```

Mezclar las dos cosas es como un fixture termina en la base de datos de producción.

## Un check en CI contra el drift

Entre el archivo de schema y la carpeta de migraciones pueden pasar dos cosas: alguien cambia el schema y olvida generar, o dos ramas generan migraciones en conflicto. Reviso ambas en CI.

```yaml
# .github/workflows/db.yml (excerpt)
- run: npm ci

# Branches that both added migrations
- run: npx drizzle-kit check

# Schema changed but no migration was generated
- run: npx drizzle-kit generate
- run: git diff --exit-code && test -z "$(git status --porcelain)"
```

`drizzle-kit check` está pensado para el primer caso. La documentación dice que revisa la consistencia del historial de migraciones y que es muy útil cuando varios desarrolladores cambian el schema en ramas distintas. El segundo paso es un truco, no una función dedicada: si el schema y las migraciones coinciden, `generate` no tiene nada que escribir y el árbol de trabajo queda limpio. Si alguien cambió el schema sin migración, `generate` escribe un archivo nuevo, o se detiene en un prompt de rename que no se puede responder en CI. En cualquier caso el job falla, que es lo que quiero.

Además, en cada pull request aplico todas las migraciones, en orden, sobre un contenedor de PostgreSQL vacío. Una migración que solo funciona con los datos de tu laptop es el tipo de rota más común.

## Lo que no me saltaría

- Revisar el SQL generado como código de aplicación.
- Todo lo destructivo o que rompe pasa por expandir, migrar, contraer.
- Un migrador, un lock, un rol con permisos de DDL.
- Los seeds viven fuera de la carpeta de migraciones.
- El CI corre `check`, regenera para detectar drift y aplica todo sobre una base vacía.

## Puntos Clave

- Usa `generate` y SQL en el repo para todo lo que llegue a producción; deja `push` para prototipos.
- El generador compara schemas, no lee intenciones. Renombres, defaults e índices necesitan a una persona.
- Expandir, migrar, contraer convierte un despliegue riesgoso en tres aburridos con rollback en cada paso.
- Toma un advisory lock a nivel de sesión sobre una sola conexión para que migradores concurrentes no compitan.
- Separa los seeds de las migraciones y deja que el CI demuestre que el schema y el historial coinciden.

## Lecturas Recomendadas

- [Drizzle ORM: Migrations overview](https://orm.drizzle.team/docs/migrations)
- [drizzle-kit generate](https://orm.drizzle.team/docs/drizzle-kit-generate)
- [drizzle-kit migrate](https://orm.drizzle.team/docs/drizzle-kit-migrate)
- [drizzle-kit push](https://orm.drizzle.team/docs/drizzle-kit-push)
- [drizzle-kit check](https://orm.drizzle.team/docs/drizzle-kit-check)
- [drizzle.config.ts reference](https://orm.drizzle.team/docs/drizzle-config-file)
- [PostgreSQL: advisory locks](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS)
