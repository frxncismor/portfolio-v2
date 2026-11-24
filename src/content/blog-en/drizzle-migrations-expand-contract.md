---
title: "Drizzle Migrations: Expand, Migrate, Contract"
description: "How I run Drizzle migrations in production: versioned SQL, reviewed diffs, expand/contract for zero-downtime changes, a locked one-shot migrator and a CI check."
date: 2026-12-14
category: "Backend"
cover: "expand"
draft: false
---

# Drizzle Migrations Without Fear: Expand, Migrate, Contract

**TL;DR:** Drizzle makes schema changes easy to write, and that is exactly why they are easy to get wrong. My rules: production only gets versioned SQL (`drizzle-kit generate`, never `push`), I read every generated file before committing it, risky changes are split into expand, migrate and contract steps across separate deploys, the migrator is a one-shot process that holds an advisory lock, and CI fails when the schema and the migrations disagree. This builds on the Drizzle section of [my monorepo post](/blog/angular-21-ssr-fastify-drizzle-monorepo/). The examples use an invented `products` table.

## generate vs push: Pick One for Production

`drizzle-kit` has two ways to get your TypeScript schema into a database, and they are not interchangeable.

| Command | What it does | Where I use it |
|---|---|---|
| `drizzle-kit generate` | Diffs your schema against the previous snapshots and writes SQL migration files | Always: it is the source of truth |
| `drizzle-kit migrate` | Applies the pending SQL files and records them in a log table | Local and CI databases |
| `drizzle-kit push` | Diffs the schema against the live database and applies it directly, with no files | Throwaway prototypes only |
| `drizzle-kit check` | Checks the consistency of the migration history | CI |

The docs describe `push` as suited to rapid prototyping, and it has a `--explain` flag that prints the planned SQL without applying it and a `--force` flag that auto-accepts data-loss statements. That is the problem for me: with `push`, the change that reaches the database is never a reviewed artifact. There is no file to read in a pull request, no history, and no way to replay the same change on staging first.

With `generate` the change is a SQL file in git. It gets reviewed, it runs once per environment, and the database remembers it did (applied migrations are recorded in a `__drizzle_migrations` table, in the `drizzle` schema by default).

A minimal config:

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

One version note. When I wrote this, the Drizzle docs describe the 1.0 release candidate, where each migration is a folder containing `migration.sql` and `snapshot.json`. The stable 0.x line still writes flat `.sql` files plus a `meta/_journal.json`. The commands in this post are the same in both, but check which layout your installed version produces before you copy paths into a script.

## Read the Generated SQL

`drizzle-kit generate` only knows the before and after of your schema. It does not know what you meant. So I treat the generated file as a diff to review, and I look for the same things every time:

- **Renames.** If you rename a column in TypeScript, the tool cannot tell a rename from a drop plus an add. It asks you interactively whether a column was renamed or created. In a non-interactive shell that prompt is a problem, so do this locally and read the result: a wrong answer means `DROP COLUMN` followed by `ADD COLUMN`, which is data loss.
- **`NOT NULL` without a default** on a table that already has rows. It will fail on the first deploy.
- **Defaults.** A `defaultNow()` in TypeScript becomes a SQL default; a value you compute in application code does not exist in the database at all.
- **Indexes.** On a big table, a plain `CREATE INDEX` blocks writes while it builds. Check what was generated and, for large tables, decide on purpose how the index gets built (PostgreSQL has `CREATE INDEX CONCURRENTLY`, which has its own restrictions, so test it against your setup before relying on it).

When the generated SQL is not what I want, I do not fight the generator. I create an empty migration and write the SQL by hand:

```bash
drizzle-kit generate --custom --name=backfill-product-name
```

That produces a new migration with an empty `migration.sql` that Drizzle applies like any other. It is the right tool for backfills and for anything the diff cannot express.

## Expand, Migrate, Contract

A migration that is correct in isolation can still take the site down. The usual cause is that the schema and the code deploy at different moments. For a few seconds (or longer in a rolling deploy) old code runs against the new schema, or new code runs against the old one.

The fix is to never ship a breaking change in one step. Take a rename: `products.title` becomes `products.name`. The one-line version is `ALTER TABLE ... RENAME COLUMN`, and it breaks every running instance that still reads `title`. Instead I use three deploys.

**1. Expand.** Add the new thing next to the old one, without removing anything.

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

The app now writes both columns and reads `name ?? title`. Old instances ignore the new column, so the migration is safe to run before the new code is live.

**2. Migrate.** Move the data, then switch the reads. The backfill is a custom migration:

```sql
UPDATE "products" SET "name" = "title" WHERE "name" IS NULL;
```

On a large table, run it in batches from a script instead of a single statement, so you do not hold a long lock. Once every row has a value, I add the constraint in its own migration:

```sql
ALTER TABLE "products" ALTER COLUMN "name" SET NOT NULL;
```

Then I deploy code that reads only `name`.

**3. Contract.** When no running version touches `title` anymore, remove it:

```sql
ALTER TABLE "products" DROP COLUMN "title";
```

The rollback story is the real benefit. Until step 3, going back is just redeploying the old code, because nothing was removed. The destructive step is last, small and separate, and it only happens after you have watched the new code run.

It is slower than one rename. For a table nobody depends on yet, one step is fine. The pattern is for the tables where a failed deploy costs you something.

## A One-Shot Migrator With an Advisory Lock

I keep migrations out of the API process. The API should not change the database on boot, and two replicas starting together should not both try. As described in the [monorepo post](/blog/angular-21-ssr-fastify-drizzle-monorepo/), the migrator is a separate one-shot container that runs, applies what is pending and exits; Compose starts the API only after it completes successfully.

The programmatic API is `migrate()` from the driver's migrator module. For node-postgres:

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

Details that matter:

- `pg_advisory_lock` is a **session-level** lock, so the lock and the migration must use the same connection. That is why I pass one `Client` instead of a `Pool`, where each query could land on a different connection.
- The lock key is an arbitrary integer. Every process that migrates this database must use the same one.
- `migrationsFolder` points at the folder `drizzle-kit generate` wrote to (`out` in the config), so the migration files must be inside the migrator image.
- The migrator connects with its own role, the one allowed to run DDL. The API role should not be.
- The process exits non-zero on failure (an unhandled rejection does that in Node), which is what stops Compose from starting the API.

Locally I use `drizzle-kit migrate`, which reads the same files and the same log table. In a deployed environment I use the script, so the code path I test is the one that runs.

## Keep Seeds Out of Migrations

A migration describes how the schema changes. Test data and demo content do not belong in it, because migrations run in production exactly once and forever.

- **Reference data the app needs to work** (roles, a fixed list of categories) can go in a custom migration, written to be idempotent with `INSERT ... ON CONFLICT DO NOTHING`.
- **Everything else** goes in a separate script, `src/db/seed.ts`, which refuses to run unless the environment is local or test.

```bash
node --env-file=.env.local dist/db/seed.js
```

Mixing the two is how a fixture ends up in the production database.

## A CI Check for Drift

Two things can go wrong between the schema file and the migrations folder: someone changes the schema and forgets to generate, or two branches generate conflicting migrations. I check both in CI.

```yaml
# .github/workflows/db.yml (excerpt)
- run: npm ci

# Branches that both added migrations
- run: npx drizzle-kit check

# Schema changed but no migration was generated
- run: npx drizzle-kit generate
- run: git diff --exit-code && test -z "$(git status --porcelain)"
```

`drizzle-kit check` is meant for the first case. The docs describe it as checking the consistency of the migration history and note it is most useful when several developers change the schema on different branches. The second step is a trick, not a dedicated feature: if the schema and the migrations agree, `generate` has nothing to write and the working tree stays clean. If someone changed the schema without a migration, `generate` writes a new file, or stops at a rename prompt that cannot be answered in CI. Either way the job fails, which is what I want.

On top of that I apply every migration to an empty PostgreSQL container, in order, on each pull request. A migration that only works on your laptop's data is the most common kind of broken.

## What I Would Not Skip

- Review the generated SQL like application code.
- Anything destructive or breaking goes through expand, migrate, contract.
- One migrator, one lock, one role with DDL rights.
- Seeds live outside the migrations folder.
- CI runs `check`, regenerates to detect drift and applies everything to an empty database.

## Key Takeaways

- Use `generate` and committed SQL for anything that reaches production; keep `push` for prototypes.
- The generator diffs schemas, it does not read intent. Renames, defaults and indexes need a human.
- Expand, migrate, contract turns one risky deploy into three boring ones with a rollback at each step.
- Take a session-level advisory lock on a single connection so concurrent migrators cannot race.
- Separate seeds from migrations, and let CI prove the schema and the migration history match.

## Further Reading

- [Drizzle ORM: Migrations overview](https://orm.drizzle.team/docs/migrations)
- [drizzle-kit generate](https://orm.drizzle.team/docs/drizzle-kit-generate)
- [drizzle-kit migrate](https://orm.drizzle.team/docs/drizzle-kit-migrate)
- [drizzle-kit push](https://orm.drizzle.team/docs/drizzle-kit-push)
- [drizzle-kit check](https://orm.drizzle.team/docs/drizzle-kit-check)
- [drizzle.config.ts reference](https://orm.drizzle.team/docs/drizzle-config-file)
- [PostgreSQL: advisory locks](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS)
