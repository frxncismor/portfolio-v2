---
title: "Cómo escribir agent skills que de verdad se usen"
description: "Cómo escribir un SKILL.md que se active cuando debe: la description que decide, revelación progresiva, un ejemplo completo y cómo probarlo."
date: 2027-01-04
category: "AI"
cover: "skills"
draft: false
---

# Cómo escribir agent skills que de verdad se usen

**TL;DR:** Una skill es una carpeta con un `SKILL.md` que le enseña a un agente un método repetible, y el agente la carga solo cuando la tarea coincide. La mayoría de las skills fallan en un solo lugar: la `description`, porque es lo único que el agente ve antes de decidir. Mantén el cuerpo corto, mueve el detalle a archivos separados, prueba la skill con prompts que deberían activarla y otros que no, y revísala como código.

En [Cómo Es Ser Desarrollador Web en 2026](/es/blog/web-dev-in-2026-with-ai/) describí las skills como buenas prácticas que codificas una sola vez. Este post es el cómo. Su complemento, [Construye tu primer servidor MCP en TypeScript](/es/blog/build-your-first-mcp-server-typescript/), cubre la otra mitad: MCP le da al agente contexto y capacidades, una skill le da un método.

## ¿Skill, prompt o CLAUDE.md?

Antes metía todo en un solo archivo de instrucciones grande. Funciona hasta que el archivo crece y cada tarea paga por reglas que no necesita. Ahora separo según *cuándo se necesita la información*:

| Dónde | Qué va ahí | Cuándo se carga |
|---|---|---|
| `CLAUDE.md` / `AGENTS.md` | Hechos y reglas que aplican a toda tarea: stack, comandos, convenciones | En cada sesión |
| Prompt | Los detalles de esta tarea | Una vez |
| Skill | Un procedimiento para un tipo de tarea recurrente | Solo cuando es relevante |

La documentación de Claude Code lo dice directo: a diferencia de `CLAUDE.md`, el cuerpo de una skill se carga solo cuando se usa, así que el material de referencia largo casi no cuesta nada hasta que se necesita. Mi regla: si es una convención que siempre aplica, va en `CLAUDE.md`. Si es un "cómo hacemos X aquí" de varios pasos, es una skill.

## Anatomía de una skill

Una skill es un directorio con un `SKILL.md`. En Claude Code, las skills de proyecto viven en `.claude/skills/<nombre-de-la-skill>/SKILL.md` (haz commit para que el equipo las tenga), y las personales en `~/.claude/skills/<nombre-de-la-skill>/SKILL.md`.

```text
.claude/skills/
└── adding-api-endpoint/
    ├── SKILL.md          # short: when to use it + the steps
    ├── conventions.md    # detail, read only when needed
    └── scripts/
        └── check-endpoint.sh
```

`SKILL.md` tiene frontmatter YAML seguido de instrucciones en Markdown:

```markdown
---
name: adding-api-endpoint
description: Adds a new REST endpoint to the orders API with schema validation and a test. Use when the user asks to add, create or expose an endpoint, route or API operation.
---
```

Dos campos importan, y la documentación de la plataforma fija los límites:

- **`name`**: solo letras minúsculas, números y guiones, hasta 64 caracteres, y no puede contener las palabras reservadas `anthropic` ni `claude`. En Claude Code además se convierte en el comando `/adding-api-endpoint`, y si lo omites toma el nombre del directorio.
- **`description`**: no vacía, hasta 1,024 caracteres en la especificación general. Claude Code trunca el texto combinado de `description` y `when_to_use` a 1,536 caracteres en su listado de skills, así que pon primero el caso de uso principal.

Claude Code ignora sin avisar los campos de frontmatter que no reconoce, y solo lee el frontmatter si el `---` de apertura es la primera línea del archivo. Un error de ortografía en el nombre de un campo falla en silencio, y esa es una buena razón para probar.

## La description es el producto

Al arrancar, solo se carga el nombre y la description de cada skill. El agente elige una skill a partir de esas líneas, quizá entre decenas. Por eso la description debe decir **qué hace la skill y cuándo usarla**, en tercera persona, con las palabras que un usuario realmente diría.

```yaml
# Vague: never triggers reliably
description: Helps with APIs

# I can help you...: wrong point of view
description: I can help you add endpoints

# Specific, third person, with triggers
description: Adds a new REST endpoint to the orders API with schema validation and a test. Use when the user asks to add, create or expose an endpoint, route or API operation.
```

La guía de Anthropic es explícita sobre el punto de vista: las descriptions se inyectan en el system prompt, y mezclar "yo" o "tú" puede causar problemas de descubrimiento. También incluyo los sinónimos que la gente usa ("route", "operation"), porque el modelo hace match por intención, y mientras más precisa sea la description sobre la situación, menos falsos positivos.

## Revelación progresiva: cuerpo corto, detalle bajo demanda

Hay tres niveles de carga: los metadatos siempre, el cuerpo de `SKILL.md` cuando la skill se activa, y los archivos extra solo cuando las instrucciones apuntan a ellos. La documentación recomienda mantener el cuerpo por debajo de 500 líneas, y yo apunto a mucho menos.

Este es el cuerpo de mi skill de ejemplo:

```markdown
# Adding an API endpoint

## Steps

1. Read `src/routes/orders.ts` to see the current pattern. Mirror it.
2. Define request and response schemas next to the route, never inline in the handler.
3. Implement the handler. Business rules go in `src/services/`, not in the route.
4. Add a test in `src/routes/orders.test.ts`: one happy path, one validation failure.
5. Run `scripts/check-endpoint.sh` and fix anything it reports before finishing.

## Details

- Naming, status codes and error shape: see [conventions.md](conventions.md).
```

Fíjate en lo que no tiene: ninguna explicación de qué es REST. La guía de buenas prácticas lo dice bien: el modelo ya es muy capaz, así que solo agrega el contexto que no tiene. Cada párrafo debe justificar su costo en tokens.

Dos reglas estructurales más de la documentación: mantén las referencias a **un solo nivel** desde `SKILL.md` (un archivo enlazado desde otro archivo enlazado puede leerse solo parcialmente), y prefiere **scripts para las comprobaciones deterministas**. Un script que valida el resultado es más confiable que pedirle al modelo que lo revise a ojo, y solo su salida entra al contexto. Deja claro si el agente debe *ejecutar* un script o *leerlo*.

## Ajusta la libertad a la fragilidad

La misma guía tiene un marco útil. Dale libertad al agente donde muchos caminos funcionan (un code review), e instrucciones exactas donde un paso mal dado cuesta caro (una migración de base de datos: "ejecuta exactamente este comando, sin agregar flags"). La mayoría de mis skills mezclan ambas: guía suelta para el diseño, pasos rígidos para los comandos que pueden hacer daño.

Si una skill solo debe correr cuando yo la pida, porque tiene efectos secundarios, Claude Code soporta `disable-model-invocation: true` en el frontmatter, de modo que solo se invoca con `/nombre`.

## Pruébala: debe activarse, no debe activarse

Trato una skill como una feature. Antes de confiar en ella escribo un puñado de prompts en dos grupos:

| Debe activarla | No debe activarla |
|---|---|
| "Add a GET /orders/:id endpoint" | "Explain how our orders route works" |
| "Expose a route to cancel an order" | "Rename the orders table" |
| "Create an API operation for refunds" | "Fix the failing orders test" |

Ejecuta cada uno en una sesión nueva y revisa si la skill se activó. Si un caso de "no debe" la activa, la description es demasiado amplia. Si uno de "debe" no la activa, agrega las palabras que usó la gente. También puedes ejecutar `/adding-api-endpoint` directamente para confirmar que el cuerpo funciona por sí mismo.

La documentación recomienda construir evaluaciones antes de escribir mucha documentación: corre el agente en tareas representativas sin la skill, anota exactamente dónde falla, escribe las instrucciones mínimas que cubren esas fallas y compara. Prueba también con los modelos que realmente usas, porque una skill que funciona con un modelo grande puede necesitar más detalle para uno pequeño.

## Mantenla viva

Las skills se pudren como cualquier documentación. Las mías viven en el repo bajo `.claude/skills/`, así que los cambios pasan por pull request y review. Cuando el agente comete el mismo error dos veces, no repito la corrección en el chat: agrego una línea a la skill. Cuando una regla deja de ser cierta, la borro. Y evito frases atadas al tiempo como "antes de marzo, usa la API vieja"; mejor mantén una sección de "patrones antiguos".

## Puntos clave

- Las reglas que siempre aplican van en `CLAUDE.md`, los detalles de una tarea en el prompt y los procedimientos recurrentes en skills.
- La `description` decide la activación: di qué hace la skill y cuándo usarla, en tercera persona y con palabras reales de activación.
- Mantén `SKILL.md` corto, enlaza el detalle a un solo nivel y usa scripts para las comprobaciones.
- Prueba con prompts que deben activar la skill y prompts que no.
- Versiona las skills en el repo y revisa sus cambios como código.

## Lecturas recomendadas

- [Extend Claude with skills (documentación de Claude Code)](https://code.claude.com/docs/en/skills)
- [Skill authoring best practices (Anthropic)](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Agent Skills overview (Anthropic)](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
