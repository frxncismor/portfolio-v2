---
title: "Build Your First MCP Server in TypeScript"
description: "A step-by-step guide to a read-only MCP server in TypeScript: tools with validated input, stdio, Claude Code setup, MCP Inspector and security basics."
date: 2026-12-07
category: "AI"
cover: "mcp"
draft: false
---

# Build Your First MCP Server in TypeScript: A Read-Only Schema Explorer

**TL;DR:** An MCP server is a small program that exposes tools to an AI agent. In about 60 lines of TypeScript you can give Claude Code a read-only view of your development database: validated input, stdio transport, registered with one `claude mcp add` command and debugged with the MCP Inspector. I also cover the security rules I follow, and when a plain script is the better answer.

In [What It's Like to Be a Web Developer in 2026](/blog/web-dev-in-2026-with-ai/) I explained what MCP servers are and why they matter. This post is the other half: building one. Everything below uses a made-up `orders`/`products` database, and I ran every command shown here.

## What an MCP Server Actually Is

MCP (Model Context Protocol) is an open protocol. A server declares **tools** (functions the model can call), **resources** (data it can read) and **prompts** (reusable templates). A client, such as Claude Code, discovers them and decides when to call them. This guide only uses tools, which is where most of the value is.

For a local server, the client starts your program as a child process and talks to it over **stdio**: JSON-RPC messages on stdin and stdout. No ports, no auth, no network.

That last detail has one consequence you must remember: **stdout belongs to the protocol**. If your code does `console.log`, you corrupt the message stream. Log to stderr (`console.error`) instead.

## The Project

I'm using the official TypeScript SDK. A note on versions: the SDK's `main` branch is now v2, published as `@modelcontextprotocol/server` (2.4.0 when I wrote this). The older v1 package, `@modelcontextprotocol/sdk`, is still maintained on the `v1.x` branch and receives bug and security fixes, so you will see both in the wild. The examples here use v2.

```bash
mkdir schema-explorer && cd schema-explorer
npm init -y
npm pkg set type=module
npm i @modelcontextprotocol/server zod better-sqlite3
npm i -D typescript @types/node @types/better-sqlite3
```

A minimal `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "build",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src"]
}
```

I use SQLite so the example runs anywhere. The same idea works with any driver, such as `pg` for PostgreSQL. `"type": "module"` matters: the server uses top-level `await`.

## The Server

Create `src/index.ts`:

```ts
import Database from "better-sqlite3";
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const dbPath = process.env.DB_PATH;
if (!dbPath) {
  console.error("DB_PATH is required"); // stderr, never stdout
  process.exit(1);
}

// Read-only connection: the server cannot write even if a tool has a bug.
const db = new Database(dbPath, { readonly: true, fileMustExist: true });

const server = new McpServer({ name: "schema-explorer", version: "1.0.0" });

server.registerTool(
  "list_tables",
  {
    title: "List tables",
    description: "List the tables in the development database.",
    annotations: { readOnlyHint: true },
  },
  async () => {
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all() as { name: string }[];
    return { content: [{ type: "text", text: rows.map((r) => r.name).join("\n") }] };
  },
);

server.registerTool(
  "describe_table",
  {
    title: "Describe table",
    description: "Return the columns of one table (name, type, nullable, primary key).",
    inputSchema: z.object({
      table: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/).describe("Table name"),
    }),
    annotations: { readOnlyHint: true },
  },
  async ({ table }) => {
    const columns = db.prepare(`SELECT name, type, "notnull", pk FROM pragma_table_info(?)`).all(table);
    if (columns.length === 0) {
      return { isError: true, content: [{ type: "text", text: `Table "${table}" not found.` }] };
    }
    return { content: [{ type: "text", text: JSON.stringify(columns, null, 2) }] };
  },
);

await server.connect(new StdioServerTransport());
console.error("schema-explorer running on stdio");
```

Build it with `npx tsc`. A few things worth noticing:

- **`registerTool(name, config, handler)`** is the whole API surface for a tool. The `description` is what the model reads to decide when to call it, so write it like documentation for a coworker.
- **`inputSchema` is a Zod object.** The SDK converts it to JSON Schema for the client and validates arguments before your handler runs. The v2 SDK accepts any Standard Schema library (Zod v4, Valibot, ArkType), and I import from `zod/v4` as the SDK docs do. The handler receives `{ table }` already typed.
- **`regex` on the table name** is deliberate. The value goes into a parameterized query, but restricting the shape of input is cheap defense in depth.
- **Errors return `isError: true`** with a message instead of throwing. The model sees the message and can recover, for instance by calling `list_tables` first.
- **`readOnlyHint: true`** is an annotation: a hint to clients that the tool doesn't change anything. Clients may use it, but it is not enforcement. The real guarantee is the `readonly: true` connection.

## Test It with the MCP Inspector Before Any Agent

Never debug a server through a chat. The MCP Inspector is the reference tool for this, and it needs no installation:

```bash
# Web UI: lists tools, lets you fill arguments and see raw JSON-RPC
npx @modelcontextprotocol/inspector -e DB_PATH=dev.db node build/index.js

# CLI mode: scriptable, handy in CI
npx @modelcontextprotocol/inspector --cli -e DB_PATH=dev.db node build/index.js --method tools/list
npx @modelcontextprotocol/inspector --cli -e DB_PATH=dev.db node build/index.js \
  --method tools/call --tool-name describe_table --tool-arg table=orders
```

`-e KEY=VALUE` passes environment variables to the server process. The Inspector requires a recent Node (22.23.4+, 24.22.1+ or 26.12.1+ at the time of writing), and the web UI prints a URL with a per-launch token.

Three checks I always run: the tool list looks right, a valid call returns real data, and an invalid call (`table=x; drop`) comes back as a validation error without ever touching the database. All three passed on this server.

## Register It in Claude Code

```bash
claude mcp add --transport stdio --env DB_PATH=/absolute/path/to/dev.db schema-explorer \
  -- node /absolute/path/to/schema-explorer/build/index.js
```

Two details from the docs that bite people:

- The **`--`** separates Claude's own options from the command that runs your server. Everything after it is passed through untouched.
- Don't put the server name directly after `--env`: the CLI would read it as another `KEY=value` pair. Keep another option, like `--transport stdio`, between them.

Use absolute paths, because the client launches the process from its own working directory. By default the server is stored with `local` scope (just you, this project). With `--scope project` it is written to a `.mcp.json` in the repo so the team shares it, and Claude Code asks for approval before running a project-scoped server. Environment variables can be referenced there as `${VAR}`, so don't commit a path or secret you wouldn't want in the repo.

Then check it:

```bash
claude mcp list      # health status of each server
claude mcp get schema-explorer
```

Inside Claude Code, `/mcp` shows server status. Ask "what columns does the orders table have?" and the agent calls `describe_table` instead of guessing from stale migrations.

## Security: The Part I Don't Skip

A tool is code the model can run with your permissions. I follow four rules.

1. **Least privilege.** The connection is read-only at the database level, not just by convention. If you need writes later, make that a separate, clearly named server.
2. **Point it at development data.** Never at production. A schema explorer doesn't need real customer rows.
3. **No secrets in responses.** Tool output goes into the model's context. Return column names, not connection strings or tokens.
4. **Validate input like any API.** The model is a client that can send surprising arguments, and anything it reads (a web page, a ticket) can try to steer it. Keep schemas tight, and treat the model's arguments as untrusted.

Also read the code of third-party MCP servers before you install them. They run on your machine.

## When an MCP Server Is Worth It, and When It Isn't

I write an MCP server when the capability is **reused across sessions or projects**, needs **structured input** the model should get right, or wraps something the agent can't reach by itself (a database, an internal API).

I don't when a script will do. If the agent can run `npm run db:schema` through its shell tool and read the output, a server adds a process, a build step and a surface to maintain. A one-off, project-specific command belongs in a script, or in a skill that tells the agent which script to run. That's exactly where the next post picks up: [Writing Agent Skills That Actually Get Used](/blog/writing-agent-skills/) covers how to encode the method, while MCP provides the context.

## Key Takeaways

- An MCP server exposes tools over stdio; the client launches it as a child process.
- `registerTool` with a Zod `inputSchema` gives you validated, typed arguments for free.
- Never write to stdout in a stdio server. Log to stderr.
- Test with the MCP Inspector first, then register with `claude mcp add ... -- <command>`.
- Enforce safety at the lowest level (a read-only connection), not with hints alone.
- If a script does the job, write the script.

## Further Reading

- [Build an MCP server (modelcontextprotocol.io)](https://modelcontextprotocol.io/docs/develop/build-server)
- [MCP TypeScript SDK (GitHub)](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector)
- [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp)
