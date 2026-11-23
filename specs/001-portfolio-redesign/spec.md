# Feature Specification: Rediseño visual del portfolio (portfolio-v2)

**Feature Branch**: `001-portfolio-redesign`
**Created**: 2026-11-22
**Status**: Draft (pendiente de OK de Paco)
**Input**: Handoff de diseño en `docs/redesign/` (`HANDOFF.md`, `prototype.html`, `tokens.css`, `logos/`), análisis en
`runs/11221608/rediseno-plan.md` (la §6, respuestas de Paco, manda sobre la §5).

## Intención

Rediseñar el portfolio y el blog de frxncismor.dev con la dirección "minimalista editorial" del handoff: Fraunces +
Geist, un solo acento verde pino, líneas de 1px en lugar de sombras, tema oscuro y claro, y movimiento sobrio.
Se implementa **dentro del stack actual** (Astro 4.16 + Tailwind 3.4 + TS), conservando contenido, rutas del blog y la
versión en español. El rediseño parte de la rama `orq/11221608` (contenido ya actualizado: Grim Builds, Regio Labs,
Valtre, posicionamiento full-stack, Shelfie fuera). **Donde el handoff choque con ese contenido, manda el handoff.**

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Home: primera impresión y navegación (Priority: P1)

Un reclutador abre `/` y ve una navbar fija (logo `FM. │ Francisco Moreno`, 4 enlaces, ES/EN, sol/luna, píldora
"Open to full-time"; a ≤640px la píldora pasa al menú), un hero con el titular "I build software for Disney, Royal Caribbean, United Airlines and OXXO."
entrando palabra por palabra, dos CTAs y la franja "Shipped for".

**Why this priority**: es lo primero que se ve y fija tokens, fuentes, tema e i18n de todo lo demás.
**Independent Test**: `npm run dev`, abrir `/` a 1280px y 390px, en oscuro/claro y ES/EN: navbar, hero y franja completos.

**Acceptance Scenarios**:
1. **Given** la home a 1280px, **When** carga, **Then** se ven los 4 enlaces (Work, Experience, Blog, Contact), ES/EN, sol/luna y la píldora con punto que late.
2. **Given** ≤900px, **When** se carga la home, **Then** los enlaces se sustituyen por un botón "Menu" que abre los 4 enlaces, y ES/EN sigue visible.
3. **Given** ≤640px, **When** se ve la navbar, **Then** el logo se reduce a `FM.`, ES/EN, sol/luna y el botón Menu caben sin scroll horizontal a 390px, y la píldora "Open to full-time" aparece dentro del menú (desvío aceptado en la parada 1).
4. **Given** el hero, **When** carga, **Then** el titular entra palabra a palabra (50ms) con las marcas en acento y cada coma pegada a su marca.

### User Story 2 - Home: trabajo y método (Priority: P1)

El visitante recorre **Work** (cuadrícula escalonada 4:5 con Grim Builds, Nox Coffee, Room Tour, Mega Basic Crossy Road;
portadas ilustradas con tokens) y **How I work** (4 tarjetas Spec/Harness/Review/Observe con ventanas simuladas y el ciclo).

**Independent Test**: secciones `#work` y `#process` en los dos temas y los dos idiomas; enlaces reales de proyecto.
**Acceptance Scenarios**:
1. **Given** Work a ≥641px, **When** se ve, **Then** hay 2 columnas y la derecha baja 96px; a ≤640px es 1 columna sin desfase.
2. **Given** una tarjeta, **When** se hace hover/foco, **Then** sube 3px, aparece `--shadow-sm` y la flecha se mueve; sin escalados.
3. **Given** Room Tour, **When** se ve su tarjeta, **Then** el texto es el actual del repo (sin tocar) con la tarjeta rediseñada.

### User Story 3 - Home: experiencia y toolkit (Priority: P2)

Filas de experiencia (Valtre "Now", Globant "5 years", y "Freelance & independent": RegioLabs y Caro Sweet MUA) y
Toolkit en 4 grupos de chips.

**Acceptance Scenarios**:
1. **Given** Experience, **When** se ve, **Then** Valtre figura como "DevCrossQA · Backend Engineer" y RegioLabs enlaza a regiolabs.com.mx.
2. **Given** Toolkit a 1280px, **When** se ve, **Then** hay 4 grupos (Frontend, Backend & data, AI workflow, Ship & observe) y a ≤1000px 2 columnas, a ≤640px 1.

### User Story 4 - Home: escritura, plantillas, sobre mí y contacto (Priority: P2)

"Latest from the blog" con los 3 posts reales más recientes, ZooNova ($25, Gumroad), About con cita, párrafos y 3 cifras, y
Contact con titular grande, `frxncismor@gmail.com` con botón copiar, enlaces a GitHub y LinkedIn, y pie.

**Acceptance Scenarios**:
1. **Given** Writing, **When** se ve, **Then** muestra los 3 posts más recientes **por fecha** de la colección del idioma activo.
2. **Given** Contact, **When** se pulsa "Copy email", **Then** se copia el correo y el botón dice "Copied" 1600ms (o "Selected" si no hay portapapeles).

### User Story 5 - Blog: lista (Priority: P2)

`/blog` con titular, buscador, filtros por tema reales (All + categorías existentes), post más reciente destacado y filas.

**Acceptance Scenarios**:
1. **Given** `/blog`, **When** se escribe en el buscador o se elige un tema, **Then** las filas no coincidentes **desaparecen de verdad** (incl. el destacado) y, si no hay ninguna, sale el estado vacío con "All topics".
2. **Given** ES activo, **When** se ve la lista, **Then** títulos y resúmenes salen en español.

### User Story 6 - Blog: artículo (Priority: P2)

`/blog/[slug]` con "← All posts", tema, fecha, tiempo de lectura, título, índice lateral que resalta la sección, barra de
progreso, texto 18px/680px, bloques de código con lenguaje o nombre + Copy, callout y tarjetas Anterior/Siguiente.

**Acceptance Scenarios**:
1. **Given** un artículo a ≥900px, **When** se hace scroll, **Then** el índice resalta la sección actual y la barra de progreso avanza.
2. **Given** ≤900px, **When** se ve, **Then** el índice no se muestra y no hay scroll horizontal.
3. **Given** un bloque de código, **When** se pulsa Copy, **Then** copia el código y dice "Copied".
4. **Given** el pie, **When** se ve, **Then** "Anterior" = post más antiguo y "Siguiente" = más nuevo (corrige el prototipo).

### User Story 7 - Tema claro/oscuro (Priority: P1)

El oscuro es el principal; el claro se activa con `prefers-color-scheme: light` o `data-theme="light"`; el botón sol/luna
guarda la elección en `localStorage` (`fm-theme`).

**Acceptance Scenarios**:
1. **Given** el SO en claro y sin elección guardada, **When** carga, **Then** sale claro sin parpadeo de oscuro (script en `<head>`).
2. **Given** una elección guardada, **When** se recarga cualquier página, **Then** se respeta, y con `localStorage` bloqueado no hay error.

### User Story 8 - ES/EN (Priority: P1)

Todo el texto nuevo existe en ES y EN; el botón ES/EN cambia toda la página sin recargar y recuerda la elección.

**Acceptance Scenarios**:
1. **Given** ES activo, **When** se recorre home, lista y artículo, **Then** no queda texto de interfaz en inglés (salvo nombres propios, marcas y términos técnicos).
2. **Given** el titular del hero en ES, **When** carga, **Then** también entra palabra a palabra y las marcas conservan el acento.

### User Story 9 - Móvil (Priority: P1)

A 390px ninguna página tiene scroll horizontal; márgenes laterales ≥16px; objetivos táctiles ≥ 34px.

### User Story 10 - Movimiento reducido (Priority: P1)

Con `prefers-reduced-motion: reduce` no hay animaciones ni transiciones, `scroll-behavior: auto`, y todo el contenido
(incluido `.reveal`) está visible.

### Edge Cases

- JS desactivado: el contenido `.reveal` debe verse (`@media (scripting: none)`) y el tema oscuro por defecto.
- `localStorage` bloqueado (modo privado): tema e idioma funcionan sin guardar, sin excepciones.
- Post sin traducción ES: se muestra el EN (fallback actual conservado).
- Post sin h2: el índice se omite y el artículo sigue ocupando 680px.
- Búsqueda sin resultados: estado vacío; "All topics" restablece buscador y filtro.
- Titular largo en ES a 390px: cada coma sigue pegada a su marca y no hay desbordes.
- Bloque de código sin lenguaje: etiqueta "text".

## Requirements *(mandatory)*

### Functional Requirements

**Base, marca y tokens**
- **FR-001**: Los colores, sombras, radios y fuentes salen de `src/styles/tokens.css` (copia de `docs/redesign/tokens.css` + `--art-*` + `--syn-*`), expuestos a Tailwind como colores `var(--…)`.
- **FR-002**: Tema oscuro por defecto; claro con `prefers-color-scheme: light` o `data-theme="light"`; `data-theme="dark"` fuerza oscuro.
- **FR-003**: Un script inline en `<head>` aplica el tema guardado (`fm-theme`, con try/catch) antes del primer pintado; `meta theme-color` correcto para ambos temas.
- **FR-004**: Fuentes: Fraunces (opsz 9..144, SOFT 100, WONK 1), Geist 400/500 y Geist Mono 400/500 por Google Fonts con `preconnect` a googleapis y gstatic. Se eliminan Epilogue, DM Mono y Material Symbols.
- **FR-005**: Iconos de flecha, sol, luna y lupa como SVG inline con `currentColor`.
- **FR-006**: Marca: `logos/*.svg` en `public/brand/`; favicon = `avatar-dark.svg` con variante clara por `media`; logo de navbar y footer en texto/CSS (`Logo.astro`).
- **FR-007**: No quedan hex, `rgb()`, `slate-*`, `white/xx` ni colores arbitrarios en `src/` fuera de `tokens.css` y de los acentos dinámicos permitidos por AGENTS.md.
- **FR-008**: Espaciado: 96–112px entre secciones (80px a ≤640px), contenedor 1120px y margen lateral ≥16px en móvil.

**Navegación**
- **FR-010**: Navbar fija de 64px con 4 enlaces (Work, Experience, Blog, Contact), ES/EN, sol/luna y píldora "Open to full-time" con punto que late (2.4s); a ≤640px la píldora se muestra dentro del menú.
- **FR-011**: A ≤900px los enlaces pasan a un botón "Menu" (`aria-expanded`, cierra con Esc y al elegir) con los mismos 4 enlaces.
- **FR-012**: A ≤640px el logo se reduce a `FM.`; el botón ES/EN **permanece visible** y la píldora "Open to full-time" pasa al menú.
- **FR-013**: En `/blog` y artículo, el enlace Blog queda marcado como actual (`aria-current`).

**Home**
- **FR-020**: Hero sin foto: etiqueta "Francisco Moreno — Software Engineer · Houston, TX", titular con marcas en acento y comas pegadas, botones "See my work" / "View experience" y línea "Angular · .NET & Node · AI-assisted, human-reviewed". Sin grano ni orbes.
- **FR-021**: Franja "Shipped for": Disney, Royal Caribbean, United Airlines, OXXO, Dick's Sporting Goods y Gannett, en Fraunces (RegioLabs solo en Experience, decisión de Paco 2026-11-23).
- **FR-022**: Work: cuadrícula de 2 columnas con portadas 4:5 y columna derecha 96px más baja; proyectos **Grim Builds, Nox Coffee, Room Tour, Mega Basic Crossy Road**. RegioLabs y Caro Sweet MUA **no** están en Work.
- **FR-023**: Portadas ilustradas en CSS/SVG con tokens `--art-*` (sin capturas); cada una `aria-hidden`; el título visible va como texto real en la tarjeta.
- **FR-024**: Cada tarjeta de Work enlaza a su URL real (`projects.ts`); Grim Builds a su GitHub y muestra stack Angular 21, Fastify, PostgreSQL, Drizzle, Zod, Docker.
- **FR-025**: **El texto de Room Tour no se modifica** (hay un to-do aparte); solo cambia el diseño de su tarjeta.
- **FR-026**: How I work: 4 tarjetas (Spec, Harness, Review, Observe) con "ventana" de entregable simulado (`aria-hidden`) y el ciclo circular con "Every release improves the next.", con textos del prototipo traducidos.
- **FR-027**: Experience: filas separadas por línea: Valtre ("Now", DevCrossQA · Backend Engineer, OXXO), Globant ("5 years", Senior Software Engineer, 5 clientes) y "Freelance & independent": RegioLabs (con enlace) y Caro Sweet MUA.
- **FR-028**: Toolkit: 4 grupos de chips (Frontend; Backend & data con .NET 10, Prisma, Oracle; AI workflow; Ship & observe con ARO) en `src/data/toolkit.ts`; sustituye a `stack.ts`.
- **FR-029**: Writing: los 3 posts más recientes **por fecha** de la colección real, con fecha, título, resumen y tema, y enlace "All posts".
- **FR-030**: Templates: ZooNova, $25, enlace real a Gumroad; portada con texto real ("ZooNova"), no en `::after`.
- **FR-031**: About: cita, párrafos y 3 cifras (6 years in production, 7 global brands, 20+ tools in production), traducidos.
- **FR-032**: Contact: titular grande, `frxncismor@gmail.com` (único correo del sitio) con botón Copy email (estados Copied/Selected, 1600ms), enlaces a `github.com/frxncismor` y `linkedin.com/in/frxncismor` (+ Blog), y pie "© año actual Francisco Moreno · Houston, TX".

**Blog**
- **FR-040**: `/blog`: titular, buscador (`type="search"`), filtros generados desde las categorías reales + "All", destacado = post más reciente y filas (fecha | título + resumen | tema).
- **FR-041**: Existe `[hidden]{display:none !important}` para que el filtrado oculte destacado y filas; estado vacío con "All topics".
- **FR-042**: Búsqueda y filtro operan sobre título y resumen del idioma activo y se componen.
- **FR-043**: `/blog/[slug]`: "← All posts", tema, fecha, tiempo de lectura (palabras/200, redondeado hacia arriba, mínimo 1), título, dek (= `description`).
- **FR-044**: Índice "On this page" generado de los h2, sticky (top 104px), con scroll-spy; oculto a ≤900px; si no hay h2 no se muestra.
- **FR-045**: Barra de progreso de lectura de 2px bajo la navbar.
- **FR-046**: Texto a 18px/31px y 680px máx. (17px/29px a ≤640px).
- **FR-047**: Bloques de código en `figure.code` con lenguaje (o `title="x.js"` opcional), botón Copy (Copied / Select to copy) y colores `--syn-*` vía Shiki `css-variables`.
- **FR-048**: `blockquote` se muestra como callout (acento suave, Fraunces 23px).
- **FR-049**: Pie "Keep reading" con tarjetas Anterior (más antiguo) y Siguiente (más nuevo); si no existe una, se omite.
- **FR-050**: Se conservan las rutas `/blog` y `/blog/[slug]`, las colecciones `blog-en`/`blog-es` y el fallback EN cuando falte el ES. Footer de sitio (logo, GitHub, LinkedIn, Contact, ©) en blog y artículo.

**i18n, movimiento, accesibilidad, SEO**
- **FR-060**: Mecanismo i18n existente ampliado: cadenas cortas `data-i18n`; bloques con marcado en `.lang-en`/`.lang-es`; datos tipados `{ en, es }`. Todo texto nuevo en ambos idiomas; `localStorage('lang')` con try/catch.
- **FR-061**: `.reveal`: opacidad + 10px, 500ms `cubic-bezier(.2,.7,.2,1)`, una sola vez, escalonado 60ms (tope 240ms, como el prototipo).
- **FR-062**: Hover solo cambia color/borde, sube 3px y mueve la flecha 2–3px; sin escalados ni rebotes.
- **FR-063**: `prefers-reduced-motion: reduce`: sin animaciones/transiciones, `scroll-behavior:auto`, todo visible.
- **FR-064**: `:focus-visible` con `--focus` en todo elemento interactivo; navegación completa por teclado; enlace "skip to content" conservado.
- **FR-065**: Contraste ≥ 4.5:1 para texto en ambos temas.
- **FR-066**: `public/llms.txt` con `frxncismor@gmail.com` y contenido alineado (Work, Experience, 6 posts); `public/og-image.svg` rehecha con la nueva marca y paleta (y `ogImage` actualizado).
- **FR-067**: `BlogCard.astro`, `data/stack.ts` y el grano/orbes del Hero se eliminan.

### Key Entities

- **Project**: id, título, categoría `{en,es}`, descripción `{en,es}`, stack, url?, githubUrl?, portada (id de `ProjectCover`).
- **ToolkitGroup**: etiqueta `{en,es}`, chips[].
- **ProcessStep**: nº, etiqueta, título, texto `{en,es}`, contenido de ventana.
- **Post** (colección): title, description, date, category, draft; derivados: readingTime, headings, prev/next.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `npm run build` termina sin errores al cerrar cada una de las 6 paradas.
- **SC-002**: `grep` de colores fijos (`#[0-9a-fA-F]{3,8}`, `rgb(`, `rgba(`, `slate-`, `white/`, `[#`) sobre `src/` solo devuelve `src/styles/tokens.css` (y los `fill`/`stroke` de SVG que usen `var(--art-*)`); 0 en componentes, datos y `global.css`. Se elimina `accentColor` de `projects.ts`.
- **SC-003**: 0 scroll horizontal a 390px en `/`, `/blog` y los 6 artículos (`document.documentElement.scrollWidth <= innerWidth`).
- **SC-004**: Contraste ≥ 4.5:1 en texto de cuerpo, muted y acento sobre `paper`/`surface`, en los dos temas (comprobado con valores de tokens).
- **SC-005**: Con teclado se alcanzan, en orden lógico y con foco visible, todos los enlaces, botones, filtros y el Menu.
- **SC-006**: Con `prefers-reduced-motion` no hay animaciones y todo el contenido es visible.
- **SC-007**: 0 textos de interfaz en inglés al activar ES en home, lista y artículo (salvo nombres propios/técnicos).
- **SC-008**: Primer pintado sin flash de tema incorrecto (el script de tema está en `<head>` antes de los estilos).
- **SC-009**: El peso de JS de cliente no aumenta de forma notable (sin nuevas dependencias de runtime).
- **SC-010**: Cada parada es revisable por Paco en local (comando `npm run dev` + lista de qué mirar) sin depender de paradas posteriores.

## Fuera de alcance

- Migrar de framework o añadir React/Vue/MDX/librerías de animación o iconos.
- Capturas reales de proyectos (se usan portadas ilustradas).
- Cambiar el texto de Room Tour (to-do aparte, PR de 11221609).
- Nuevas rutas, paginación del blog, RSS, búsqueda en el cuerpo de los posts, comentarios.
- Cambiar contenido de los artículos del blog.
- Tests automáticos / lint (el repo no los tiene); no se añaden en esta corrida.
- Push, PR o merge: solo con permiso de Paco.

## Decisiones de Paco (rediseno-plan.md §6, 2026-11-22)

1. Base: contenido primero; el rediseño parte de `orq/11221608`; el handoff manda donde choque (RegioLabs fuera de Work, Caro Sweet solo en Experience).
2. Nav ≤900px: botón "Menu" sencillo con los 4 enlaces.
3. ES/EN visible también en móvil.
4. Paradas de revisión: 6 agrupadas.
5. Correo único `frxncismor@gmail.com` (también en `llms.txt`).
6. Sin capturas: portadas ilustradas con tokens; og-image rehecha con la nueva marca en esta corrida.

## Assumptions

- Datos ya resueltos con Paco: puesto en Valtre "DevCrossQA · Backend Engineer"; stack de Grim Builds Angular 21, Fastify, PostgreSQL, Drizzle, Zod, Docker; GitHub `github.com/frxncismor`, LinkedIn `linkedin.com/in/frxncismor`, Gumroad `frxncismor.gumroad.com/l/zoo-nova-html`; URLs de proyectos de `projects.ts`.
- El ES de las ~120 cadenas nuevas lo redacta implementación y lo revisa Paco en cada parada.
- Las URLs de RegioLabs y Caro Sweet son las de `experience.ts` (`caro-sweet-mua.vercel.app`).
- La paleta `--art-*` reutiliza los hex de las ilustraciones del prototipo como tokens nombrados.
- El prototipo es la referencia visual; donde contradiga el HANDOFF o los criterios de terminado, se corrige (ver plan.md, "Correcciones al prototipo").
- Idiomas: el sitio sigue siendo una sola URL por página (sin rutas `/es`), como hoy.

## Dudas abiertas

Ninguna bloqueante. Dudas menores de criterio (con recomendación) en el reporte y en plan.md §"Preguntas para Paco".
