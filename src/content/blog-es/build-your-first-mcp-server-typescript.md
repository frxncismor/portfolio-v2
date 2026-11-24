---
title: "Construye tu primer servidor MCP en TypeScript"
description: "Guía paso a paso de un servidor MCP de solo lectura en TypeScript: tools con input validado, stdio, Claude Code, MCP Inspector y seguridad básica."
date: 2026-12-07
category: "AI"
cover: "mcp"
draft: false
---

# Construye tu primer servidor MCP en TypeScript: un explorador de schema de solo lectura

**TL;DR:** Un servidor MCP es un programa pequeño que expone herramientas a un agente de IA. Con unas 60 líneas de TypeScript puedes darle a Claude Code una vista de solo lectura de tu base de datos de desarrollo: input validado, transporte stdio, registro con un solo comando `claude mcp add` y depuración con el MCP Inspector. También cubro las reglas de seguridad que sigo y cuándo un script simple es mejor respuesta.

En [Cómo Es Ser Desarrollador Web en 2026](/es/blog/web-dev-in-2026-with-ai/) expliqué qué son los servidores MCP y por qué importan. Este post es la otra mitad: construir uno. Todo usa una base de datos inventada de `orders`/`products`, y ejecuté cada comando que aparece aquí.

## Qué es realmente un servidor MCP

MCP (Model Context Protocol) es un protocolo abierto. Un servidor declara **tools** (funciones que el modelo puede llamar), **resources** (datos que puede leer) y **prompts** (plantillas reutilizables). Un cliente, como Claude Code, los descubre y decide cuándo usarlos. Esta guía solo usa tools, que es donde está la mayor parte del valor.

En un servidor local, el cliente lanza tu programa como proceso hijo y se comunica por **stdio**: mensajes JSON-RPC por stdin y stdout. Sin puertos, sin autenticación, sin red.

Esto trae una consecuencia que debes recordar: **stdout le pertenece al protocolo**. Si tu código hace `console.log`, corrompes el flujo de mensajes. Escribe los logs a stderr (`console.error`).

## El proyecto

Uso el SDK oficial de TypeScript. Una nota sobre versiones: la rama `main` del SDK ya es la v2, publicada como `@modelcontextprotocol/server` (2.4.0 cuando escribí esto). El paquete anterior, `@modelcontextprotocol/sdk` (v1), se sigue manteniendo en la rama `v1.x` con correcciones de bugs y seguridad, así que verás ambos en proyectos reales. Los ejemplos usan la v2.

```bash
mkdir schema-explorer && cd schema-explorer
npm init -y
npm pkg set type=module
npm i @modelcontextprotocol/server zod better-sqlite3
npm i -D typescript @types/node @types/better-sqlite3
```

Un `tsconfig.json` mínimo:

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

Uso SQLite para que el ejemplo corra en cualquier lado. La misma idea funciona con otro driver, como `pg` para PostgreSQL. `"type": "module"` importa: el servidor usa `await` de nivel superior.

## El servidor

Crea `src/index.ts`:

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

Compílalo con `npx tsc`. Cosas que vale la pena notar:

- **`registerTool(name, config, handler)`** es toda la superficie de la API para una tool. La `description` es lo que el modelo lee para decidir cuándo llamarla, así que escríbela como documentación para un compañero.
- **`inputSchema` es un objeto de Zod.** El SDK lo convierte a JSON Schema para el cliente y valida los argumentos antes de ejecutar tu handler. La v2 acepta cualquier librería compatible con Standard Schema (Zod v4, Valibot, ArkType), y yo importo de `zod/v4` como en la documentación del SDK. El handler recibe `{ table }` ya tipado.
- **El `regex` en el nombre de tabla** es intencional. El valor va a una consulta parametrizada, pero restringir la forma del input es barato y suma una capa más de defensa.
- **Los errores devuelven `isError: true`** con un mensaje en lugar de lanzar una excepción. El modelo lo ve y puede recuperarse, por ejemplo llamando primero a `list_tables`.
- **`readOnlyHint: true`** es una anotación: una pista para los clientes de que la tool no modifica nada. Pueden usarla, pero no es una garantía. La garantía real es la conexión con `readonly: true`.

## Pruébalo con el MCP Inspector antes de usar cualquier agente

Nunca depures un servidor a través de un chat. El MCP Inspector es la herramienta de referencia para esto y no requiere instalación:

```bash
# Web UI: lista las tools, te deja llenar argumentos y ver el JSON-RPC crudo
npx @modelcontextprotocol/inspector -e DB_PATH=dev.db node build/index.js

# Modo CLI: scriptable, útil en CI
npx @modelcontextprotocol/inspector --cli -e DB_PATH=dev.db node build/index.js --method tools/list
npx @modelcontextprotocol/inspector --cli -e DB_PATH=dev.db node build/index.js \
  --method tools/call --tool-name describe_table --tool-arg table=orders
```

`-e CLAVE=VALOR` pasa variables de entorno al proceso del servidor. El Inspector requiere un Node reciente (22.23.4+, 24.22.1+ o 26.12.1+ al momento de escribir esto), y la UI web imprime una URL con un token por ejecución.

Siempre hago tres comprobaciones: que la lista de tools se vea bien, que una llamada válida devuelva datos reales y que una inválida (`table=x; drop`) regrese un error de validación sin tocar nunca la base de datos. Las tres pasaron con este servidor.

## Regístralo en Claude Code

```bash
claude mcp add --transport stdio --env DB_PATH=/absolute/path/to/dev.db schema-explorer \
  -- node /absolute/path/to/schema-explorer/build/index.js
```

Dos detalles de la documentación que suelen morder:

- El **`--`** separa las opciones de Claude del comando que ejecuta tu servidor. Todo lo que va después se pasa tal cual.
- No pongas el nombre del servidor justo después de `--env`: el CLI lo leería como otro par `CLAVE=valor`. Deja otra opción, como `--transport stdio`, entre ambos.

Usa rutas absolutas, porque el cliente lanza el proceso desde su propio directorio de trabajo. Por defecto el servidor se guarda con scope `local` (solo tú, en este proyecto). Con `--scope project` se escribe en un `.mcp.json` del repo para que el equipo lo comparta, y Claude Code pide aprobación antes de ejecutar un servidor de proyecto. Ahí se pueden referenciar variables de entorno como `${VAR}`, así que no commitees una ruta o un secreto que no quieras en el repo.

Luego compruébalo:

```bash
claude mcp list      # estado de salud de cada servidor
claude mcp get schema-explorer
```

Dentro de Claude Code, `/mcp` muestra el estado de los servidores. Pregunta "¿qué columnas tiene la tabla orders?" y el agente llama a `describe_table` en lugar de adivinar a partir de migraciones viejas.

## Seguridad: la parte que no me salto

Una tool es código que el modelo puede ejecutar con tus permisos. Sigo cuatro reglas.

1. **Mínimo privilegio.** La conexión es de solo lectura a nivel de base de datos, no solo por convención. Si más adelante necesitas escritura, que sea otro servidor, con un nombre claro.
2. **Apúntalo a datos de desarrollo.** Nunca a producción. Un explorador de schema no necesita filas reales de clientes.
3. **Sin secretos en las respuestas.** La salida de una tool entra al contexto del modelo. Devuelve nombres de columnas, no cadenas de conexión ni tokens.
4. **Valida el input como en cualquier API.** El modelo es un cliente que puede mandar argumentos sorprendentes, y cualquier cosa que lea (una página web, un ticket) puede intentar manipularlo. Mantén los schemas estrictos y trata los argumentos del modelo como no confiables.

Lee también el código de los servidores MCP de terceros antes de instalarlos. Corren en tu máquina.

## Cuándo vale la pena un servidor MCP y cuándo no

Escribo un servidor MCP cuando la capacidad **se reutiliza entre sesiones o proyectos**, necesita **input estructurado** que el modelo debe acertar, o envuelve algo que el agente no alcanza solo (una base de datos, una API interna).

No lo hago cuando basta un script. Si el agente puede ejecutar `npm run db:schema` con su herramienta de shell y leer la salida, un servidor añade un proceso, un paso de build y una superficie que mantener. Un comando puntual, específico de un proyecto, va en un script, o en una skill que le diga al agente qué script correr. Justo ahí continúa el siguiente post: [Cómo escribir agent skills que de verdad se usen](/es/blog/writing-agent-skills/) explica cómo codificar el método, mientras que MCP aporta el contexto.

## Puntos clave

- Un servidor MCP expone tools por stdio; el cliente lo lanza como proceso hijo.
- `registerTool` con un `inputSchema` de Zod te da argumentos validados y tipados sin esfuerzo.
- Nunca escribas en stdout en un servidor stdio. Usa stderr para los logs.
- Prueba primero con el MCP Inspector y luego regístralo con `claude mcp add ... -- <comando>`.
- Haz cumplir la seguridad en el nivel más bajo (una conexión de solo lectura), no solo con hints.
- Si un script resuelve el problema, escribe el script.

## Lecturas recomendadas

- [Build an MCP server (modelcontextprotocol.io)](https://modelcontextprotocol.io/docs/develop/build-server)
- [MCP TypeScript SDK (GitHub)](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector)
- [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp)
