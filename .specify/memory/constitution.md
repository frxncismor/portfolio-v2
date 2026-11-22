# portfolio-v2 Constitution

## Core Principles

### I. Stack fijo
Astro 4.16 estático + Tailwind 3.4 + TypeScript estricto + JS vanilla. No se añade React/Vue, librerías de animación
ni de iconos. Deploy estático en Vercel.

### II. Tokens, nunca colores fijos
Todo color sale de variables CSS (`src/styles/tokens.css`) expuestas como colores de Tailwind. Prohibidos hex, `rgb()`,
`slate-*`, `white/xx` y valores arbitrarios de color en componentes. Únicas excepciones: acentos dinámicos pasados como
props con `style` inline (AGENTS.md) y la paleta de ilustración `--art-*` definida en `tokens.css`.

### III. Bilingüe EN/ES
Todo texto visible existe en inglés y en español. Datos con `{ en, es }` tipado; cadenas cortas con `data-i18n`;
bloques con marcado con `.lang-en` / `.lang-es`.

### IV. Accesible y con movimiento respetuoso
Teclado completo, foco visible (`:focus-visible` con `--focus`), contraste ≥ 4.5:1 en ambos temas, sin scroll horizontal
a 390px, y nada se anima con `prefers-reduced-motion: reduce`.

### V. Verificación por parada
`npm run build` verde es el único gate automático (el repo no tiene lint ni tests). Cada parada de revisión es
entregable y verificable por separado y no se avanza sin el OK de Paco.

### VI. Convenciones del repo
`AGENTS.md` manda: TypeScript sin `any` implícito, `const`, sin imports sin usar, componentes PascalCase, datos camelCase
en `src/data/`, frontmatter de Astro mínimo, commits convencionales sin atribución de IA.

**Version**: 1.0.0 | **Ratified**: 2026-11-22
