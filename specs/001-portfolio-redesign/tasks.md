# Tasks: Rediseño visual del portfolio

**Input**: `specs/001-portfolio-redesign/{spec,plan}.md`, `docs/redesign/*`
**Tests**: el repo no tiene tests ni lint. Gate automático = `npm run build`. Verificación = greps + revisión manual.
**Formato**: `[ID] [P?] descripción con ruta exacta`. `[P]` = paralelizable (archivos distintos).
**Organización**: 6 paradas de revisión (rediseno-plan §6.4). Cada una es entregable por separado; **no se avanza sin el OK de Paco**.

**Comprobación común a toda parada** (se repite en su bloque):
- `npm run build` verde.
- Grep de colores fijos en lo tocado: `rg -n "#[0-9a-fA-F]{3,8}\b|rgba?\(|slate-|white/|\[#" <archivos tocados>` → 0 (excepto `src/styles/tokens.css`).
- 390px sin scroll horizontal; Tab recorre todo con foco visible; reduced-motion sin animaciones.
- Cada parada se integra en la rama de integración con `Orq-Worktree.ps1`; el principal entrega a Paco el comando `npm run dev` desde esa ruta.

---

## Parada 1 — Base + Nav + Hero

**Objetivo**: tokens, tema, fuentes, marca, i18n `{en,es}`, movimiento base, navbar (con Menu y ES/EN en móvil), hero y franja "Shipped for".

### Base
- [x] T-001 Crear `src/styles/tokens.css`: copiar `docs/redesign/tokens.css`; añadir `--art-*` (hex de las ilustraciones del prototipo: ver `plan.md`) y `--syn-*`/`--code-bg` por tema; `--focus` con `var()`.
- [x] T-002 Reescribir `tailwind.config.mjs`: colores `paper, surface, sunken, ink, muted, hairline, accent, accent-soft, on-accent, clay, deep, art.*` = `var(--…)`; radios 4/10/16; `fontFamily` `display/sans/mono`; `maxWidth.wrap 1120px`; `boxShadow sm/focus`. Quitar la paleta morada.
- [x] T-003 Reescribir `src/styles/global.css`: importar tokens; reset base; `.wrap`, `.label`, `.serif`, `.btn(.ghost)`, `.link`, `.arrow`, `.chip`, `.topic`, `.reveal(.pending)`, `[hidden]{display:none!important}`, `:focus-visible` con `--focus` (sin `border-radius` global), `.sr-only`/skip link, `@media (scripting: none)` y `@media (prefers-reduced-motion: reduce)`, `html[data-lang]` para `.lang-en/.lang-es`. Eliminar `.grain-overlay`, `.fade-in` y `.material-symbols-outlined`.
- [x] T-004 [P] Crear `src/i18n/types.ts` (`Localized = { en: string; es: string }`) y ampliar `src/i18n/translations.ts` con claves de nav, hero, franja, menú, tema, idioma; mantener las existentes que sigan usándose.
- [x] T-005 Actualizar `src/scripts/i18n.ts`: `try/catch` en `localStorage`; soporte `data-i18n-aria`; sin ocultar la página con `opacity:0` (evitar parpadeo con el script del `<head>`).
- [x] T-006 [P] Reescribir `src/scripts/animations.ts`: `.reveal` (500ms, `cubic-bezier(.2,.7,.2,1)`, 10px, una vez, escalonado `min(i,4)*60ms`, solo elementos bajo el pliegue), no-op con reduced-motion/sin IntersectionObserver.
- [x] T-007 [P] Crear `public/brand/` con los 6 SVG de `docs/redesign/logos/`; sustituir `public/favicon.svg` por `avatar-dark.svg`.
- [x] T-008 Actualizar `src/layouts/Layout.astro`: script de tema en `<head>` antes de los estilos (clave `fm-theme`, try/catch); `<meta theme-color>` doble con `media`; fuentes Fraunces + Geist + Geist Mono con `preconnect` a googleapis y gstatic; favicon dark/light con `media`; quitar Epilogue, DM Mono y Material Symbols; `color-scheme`.
- [x] T-009 Crear `src/components/Logo.astro` (FM. + punto + regla + "Francisco Moreno", texto/CSS; variante `FM.` ≤640px).
- [x] T-010 [P] Crear `src/components/ThemeToggle.astro` y `src/scripts/theme.ts` (alterna `data-theme`, guarda `fm-theme`, `aria-label` traducido, sol/luna SVG por CSS).

### Nav
- [x] T-011 Reescribir `src/components/Nav.astro`: sticky 64px, blur + `color-mix`, línea hairline; Logo, 4 enlaces (`/#work`, `/#experience`, `/blog`, `/#contact`), botón ES/EN (`#lang-toggle`), ThemeToggle, píldora "Open to full-time" con punto que late (`@keyframes pulse` 2.4s). `aria-current` en Blog dentro de `/blog*`.
- [x] T-012 Crear `src/scripts/nav.ts` y el botón **Menu** ≤900px: oculta los 4 enlaces y abre un panel con los mismos enlaces (`aria-expanded`, `aria-controls`, cierra con Esc, al elegir y al pasar a >900px). ES/EN permanece visible a ≤640px; logo `FM.` a ≤640px; todo cabe a 390px.

### Hero
- [x] T-013 Reescribir `src/components/Hero.astro`: etiqueta "Francisco Moreno — Software Engineer · Houston, TX"; titular palabra por palabra en `.lang-en` y `.lang-es` (`span.w`, `animation-delay` 50ms, marcas en `text-accent`, comas con `white-space:nowrap` pegadas); botones "See my work" / "View experience"; línea "Angular · .NET & Node · AI-assisted, human-reviewed"; sin foto, grano ni orbes. `padding` 120/96 (72/64 ≤900px).
- [x] T-014 Crear `src/components/Clients.astro`: franja "Shipped for" (Disney, Royal Caribbean, United Airlines, OXXO, Dick's Sporting Goods, Gannett, RegioLabs) en Fraunces 22px entre dos hairlines.
- [x] T-015 Modificar `src/pages/index.astro`: Nav → Hero → Clients; el resto de secciones actuales siguen montadas (se migran en las paradas 2–4).
- [x] T-016 Modificar `src/components/Footer.astro` mínimo (tokens, sin `slate-*`, sin `white/`) para que no rompa la home entre paradas; el rediseño completo va en la parada 4/5.

### Cierre de la parada 1
- [x] T-017 Comprobar y corregir: build verde, greps en `Layout, Nav, Hero, Clients, Logo, ThemeToggle, global.css, tailwind.config.mjs`; 390px sin scroll horizontal; recarga con tema claro guardado sin parpadeo; reduced-motion; Menu con teclado.

**Qué debe ver Paco en local**
- `npm run dev` → `/` en **1280px** y **390px**, tema **oscuro y claro** (botón sol/luna y cambiando el SO), **ES y EN**.
- Navbar: logo, 4 enlaces, ES/EN, sol/luna, píldora que late. ≤900px: botón **Menu** con los 4 enlaces. 390px: logo `FM.` + ES/EN + sol/luna caben.
- Hero: titular entrando palabra a palabra, marcas en acento, comas pegadas; botones y línea inferior. Franja "Shipped for" con 7 nombres.
- Recargar con tema claro guardado: sin flash oscuro. Con ES, el titular también anima.
- Las secciones de debajo (Work, Experience…) aún son las antiguas y pueden verse incoherentes: es esperado hasta la parada 4.
- Comprobaciones: grep colores fijos = 0; Tab con foco visible; DevTools → reduced-motion: sin animaciones.

---

## Parada 2 — Work + How I work (Process)

**Objetivo**: cuadrícula escalonada de proyectos con portadas ilustradas y la sección de método.

- [ ] T-018 Modificar `src/data/projects.ts`: dejar solo `grim-builds`, `nox-coffee`, `room-tour`, `crossy-road` (quitar `regio-labs` y `caro-sweet-mua`); campos `category`/`description` como `Localized`; quitar `accentColor`; Grim Builds con stack Angular 21, Fastify, PostgreSQL, Drizzle, Zod, Docker. **Room Tour: descripción y título actuales sin cambios** (solo se añade su traducción ES literal del texto vigente).
- [ ] T-019 Crear `src/components/ProjectCover.astro`: portadas por `id` con `--art-*` y `aria-hidden`: Grim (constelación + título), Nox (luna + "Nox"), Room (habitación isométrica), Crossy (7 filas con coche animado `drive`, desactivado con reduced-motion). Estilos en `<style>` con alcance; SOFT 100 en el título de Grim.
- [ ] T-020 Reescribir `src/components/ProjectCard.astro`: enlace a la URL real (`url ?? githubUrl`), `.shot` 4:5 radio 16 con hairline, `.tag` con tokens, flecha ↗ SVG, descripción y stack (label mono); hover: sube 3px + `--shadow-sm` + flecha 2px; `aria-label` con nombre del proyecto.
- [ ] T-021 Reescribir `src/components/Work.astro`: cabecera (label, h2 "Things I've built lately", nota), grid 2 columnas con `nth-child(even){margin-top:96px}`, 1 columna ≤640px; `.reveal` y escalonado.
- [ ] T-022 [P] Crear `src/data/process.ts` (4 pasos con textos `Localized` y contenido de ventana) y `src/components/Process.astro`: 4 tarjetas (grid 4/2/1 col) con ventanas simuladas `aria-hidden` (spec.md, run #482, review PR 213, producción con sparkline SVG con `--accent`/`--accent-soft`).
- [ ] T-023 Añadir a `Process.astro` el ciclo circular SVG (`role="img"`, `aria-label` traducido; nodos SPEC/BUILD/REVIEW/OBSERVE; el nodo SPEC con token, no `#ECEAE4`) + "Every release improves the next."
- [ ] T-024 [P] Ampliar `src/i18n/translations.ts` con cabeceras de Work/Process; traducir al ES todas las descripciones, pasos y el texto del ciclo.
- [ ] T-025 Modificar `src/pages/index.astro`: Hero → Clients → Work → Process.
- [ ] T-026 Cierre: build verde; greps en `data/projects.ts, ProjectCover, ProjectCard, Work, Process`; 390px (1 columna, ventanas sin desborde); hover/foco; reduced-motion (coche de Crossy parado); ES/EN.

**Qué debe ver Paco en local**
- `/#work` y `/#process` en **1280px** y **390px**, **oscuro y claro**, **ES y EN**.
- Work: 4 tarjetas (Grim Builds, Nox Coffee, Room Tour, Mega Basic Crossy Road), columna derecha 96px más baja; **sin RegioLabs ni Caro Sweet**; Room Tour con su texto actual; stack de Grim visible; todas enlazan al sitio real.
- Portadas: constelación, luna, habitación isométrica, carretera con coche. Mismo aspecto en claro y oscuro (son arte).
- Process: 4 tarjetas con ventanas y el ciclo; a 390px una columna.
- Comprobaciones: grep colores fijos = 0 (los hex de arte viven solo en `tokens.css`); hover sube 3px sin escalado; Tab recorre tarjetas con foco visible.

---

## Parada 3 — Experience + Toolkit

- [ ] T-027 Modificar `src/data/experience.ts`: datos `Localized` y orden: Valtre (Now, "DevCrossQA · Backend Engineer", OXXO), Globant (5 years, Senior Software Engineer, 5 clientes), freelance: RegioLabs (`https://regiolabs.com.mx/`), Caro Sweet MUA, Vaneybr; quitar iconos de Material (`icon`) y Nox Coffee/Shelfie del freelance.
- [ ] T-028 Reescribir `src/components/Experience.astro`: filas `grid 180px 1fr auto` con `border-top` hairline; subtítulo "Freelance & independent"; enlace ↗ con `aria-label` traducido (solo donde hay URL real); `.reveal`; ≤640px `1fr auto`.
- [ ] T-029 [P] Crear `src/data/toolkit.ts` (4 grupos `Localized`: Frontend; Backend & data con .NET 10, Prisma, Oracle; AI workflow; Ship & observe con ARO) y `src/components/Toolkit.astro` (chips 28px radio 4 `bg-accent-soft`, grid 4/2/1 col, nota). Eliminar `src/data/stack.ts`.
- [ ] T-030 [P] Ampliar `src/i18n/translations.ts` (cabeceras, "Now", "5 years", "Client", "Freelance & independent") y traducir descripciones al ES.
- [ ] T-031 Modificar `src/pages/index.astro`: … Process → Experience → Toolkit; quitar el bloque de chips antiguo de Experience.
- [ ] T-032 Cierre: build verde; greps; 390px; ES/EN; verificar que RegioLabs aparece en Experience y en "Shipped for", y Caro Sweet solo en Experience.

**Qué debe ver Paco en local**
- `/#experience` y `/#stack` en **1280px/390px**, **oscuro/claro**, **ES/EN**.
- Filas: Valtre → Globant → Freelance (RegioLabs con enlace a regiolabs.com.mx, Caro Sweet MUA, Vaneybr). Puesto de Valtre "DevCrossQA · Backend Engineer".
- Toolkit en 4 grupos (4 col → 2 col ≤1000px → 1 col ≤640px) con .NET 10, Prisma, Oracle y ARO.
- Comprobaciones: grep colores fijos = 0; enlaces externos con `rel="noopener"`; foco visible en cada ↗.

---

## Parada 4 — Writing + Templates + About + Contact (+ pie de la home)

- [ ] T-033 Crear `src/lib/readingTime.ts` (`Math.max(1, Math.ceil(words/200))`).
- [ ] T-034 Crear `src/components/blog/PostRow.astro` (fila `120px | título+resumen | tema`; fecha corta, h3 Fraunces 26px; hover cambia el color del título). Se reutiliza en lista y en Writing.
- [ ] T-035 Crear `src/components/Writing.astro`: carga `blog-en` y `blog-es` sin borradores, **ordena por fecha desc**, toma 3; enlace "All posts" → `/blog`; títulos/resúmenes en ambos idiomas (`.lang-*`) con fallback EN.
- [ ] T-036 Modificar `src/data/templates.ts` (ZooNova, `$25`, Gumroad `https://frxncismor.gumroad.com/l/zoo-nova-html`, etiqueta "HTML · Tailwind CSS · 6 pages", texto `Localized`) y reescribir `Templates.astro` + `TemplateCard.astro`: tarjeta 2 columnas con portada `--art-*` y "ZooNova" como texto real; "Buy on Gumroad →". Una columna ≤900px.
- [ ] T-037 [P] Crear `src/data/about.ts` (cifras: 6 years in production, 6 global brands, 20+ tools in production, `Localized`) y reescribir `About.astro`: cita con `<em>` (acento) en bloques `.lang-en/.lang-es`, 3 párrafos, `.facts` con borde superior y números Fraunces 40px (30px ≤640px).
- [ ] T-038 [P] Crear `src/scripts/contact.ts` (copia el correo con `navigator.clipboard`, fallback `Selected`, 1600ms) y reescribir `Contact.astro`: fondo `sunken`, titular "Let's build something good.", `frxncismor@gmail.com` (Fraunces, acento, `user-select:all`), botón "Copy email", enlaces GitHub `https://github.com/frxncismor`, LinkedIn `https://linkedin.com/in/frxncismor` y Blog; pie "© {año} Francisco Moreno" · "Houston, TX · Built with care" (sin "© 2024" fijo).
- [ ] T-039 [P] Ampliar `src/i18n/translations.ts` con Writing/Templates/About/Contact y todos los textos ES (incluidos estados Copied/Selected).
- [ ] T-040 Modificar `src/pages/index.astro`: … Toolkit → Writing → Templates → About → Contact (sin Footer separado: el pie va dentro de Contact).
- [ ] T-041 Cierre: build verde; greps; 390px; ES/EN; copiar correo con teclado; Writing muestra los 3 más recientes (Apr 5, Apr 4, Apr 1 de 2026) y no los del prototipo.

**Qué debe ver Paco en local**
- La home completa de arriba abajo en **1280px/390px**, **oscuro/claro**, **ES/EN**.
- Writing: 3 posts reales ordenados por fecha; "All posts" lleva a `/blog`.
- ZooNova con precio y enlace a Gumroad; About con cita y 3 cifras; Contact: pulsar "Copy email" cambia a "Copied" ~1.6s; enlaces a GitHub y LinkedIn correctos; un solo correo en toda la home.
- Comprobaciones: grep colores fijos = 0; `rg "hello@frxncismor" src` = 0; no quedan `Material Symbols` ni `.fade-in` en `src/`.

---

## Parada 5 — Blog: lista

- [ ] T-042 Crear `src/components/blog/FeaturedPost.astro` (tarjeta 2 columnas con diagrama SVG CLIENT/API/DATA de tokens `--deep`/`--art-*`, tema, fecha larga, título, resumen, "Read post →"; 1 columna ≤900px).
- [ ] T-043 Reescribir `src/pages/blog/index.astro`: cabecera (label, h1 "Notes on Angular, backend and building with AI", lead), buscador `type="search"` con icono lupa, filtros `role="group"` generados con las **categorías reales** + "All", destacado = el más reciente, filas con `PostRow`, estado vacío con botón "All topics"; JSON-LD y manifiesto de búsqueda conservados; footer de sitio.
- [ ] T-044 Reescribir `src/scripts/blog.ts`: filtro por tema + texto sobre destacado y filas (`data-topic`, `data-text`), uso de `hidden`, `aria-pressed` en filtros, estado vacío, reset; búsqueda sobre el idioma activo.
- [ ] T-045 Reescribir `src/components/Footer.astro` como footer de sitio (Logo, GitHub, LinkedIn, Contact, © dinámico) y usarlo en `/blog` y `/blog/[slug]`; la home conserva el pie dentro de Contact.
- [ ] T-046 [P] Ampliar `src/i18n/translations.ts` (blog: label, titular, lead, placeholder, filtros, vacío, "Read post", "All posts") y traducir; las categorías se muestran con su nombre (Angular, Backend, JavaScript, AI).
- [ ] T-047 Eliminar `src/components/BlogCard.astro` y limpiar estilos `.filter-active`/pills antiguos.
- [ ] T-048 Cierre: build verde; greps; 390px (filtros hacen wrap, filas en 2 columnas); búsqueda y cada filtro; estado vacío; ES/EN.

**Qué debe ver Paco en local**
- `/blog` en **1280px/390px**, **oscuro/claro**, **ES/EN**.
- Destacado = el post más reciente (Apr 5, "From Frontend to Full-Stack"); 5 filas debajo ordenadas por fecha.
- Buscar "signals" deja solo ese post; el filtro "JavaScript" deja 2; combinar ambos; sin resultados → mensaje con "All topics" que restablece. El destacado también se oculta al no coincidir.
- Footer de sitio visible. Comprobaciones: grep colores fijos = 0; Tab: buscador → filtros → destacado → filas con foco visible.

---

## Parada 6 — Blog: artículo + cierre

- [ ] T-049 Modificar `astro.config.mjs`: `markdown.shikiConfig.theme = 'css-variables'`.
- [ ] T-050 Reescribir `.prose` en `src/styles/global.css`: 18px/31px, 680px, h2 Fraunces 32px (`scroll-margin-top:96px`), `strong` 500, `code` en línea con `accent-soft`, `blockquote` como `.callout` (acento suave, Fraunces 23px), `figure.code` (hairline, radio 10, `--code-bg`, `figcaption` mono, `pre` 14.5px/1.75), mapeo `--astro-code-token-*` → `--syn-*`; ajustes ≤640px.
- [ ] T-051 [P] Crear `src/components/blog/Toc.astro` (aside "On this page", sticky `top:104px`, oculto ≤900px, vacío si no hay h2).
- [ ] T-052 Crear `src/scripts/article.ts`: progreso (barra 2px bajo la navbar), scroll-spy (último h2 con `top<140`), clic del índice con `scrollIntoView` (instantáneo con reduced-motion), envoltura `pre` → `figure.code` con lenguaje + botón Copy (Copied / Select to copy, 1500ms).
- [ ] T-053 Reescribir `src/pages/blog/[slug].astro`: "← All posts", tema, fecha, "N min read" (readingTime), h1 Fraunces, dek (= `description`), grid `200px | 680px`, contenido EN/ES con `.lang-*`, `headings` para el índice de cada idioma, JSON-LD conservado, footer de sitio.
- [ ] T-054 Añadir pie "Keep reading" con tarjetas **Anterior (más antiguo)** y **Siguiente (más nuevo)** por fecha; se omite la que no exista; títulos por idioma.
- [ ] T-055 [P] Ampliar `src/i18n/translations.ts` ("← All posts", "On this page", "min read", "Keep reading", "Next", "Previous", "Copy", "Copied", "Select to copy") y traducir.
- [ ] T-056 Cierre — `public/llms.txt`: correo `frxncismor@gmail.com`; título "Full-Stack Software Engineer"; experiencia y proyectos alineados con los datos actuales; los 6 posts.
- [ ] T-057 Cierre — `public/og-image.svg` nueva con la marca (lockup, `paper` oscuro, acento verde, sin morado); actualizar `Layout.astro` (`og:image`, `twitter:image`, `theme-color`).
- [ ] T-058 Cierre — barrido global: `rg -n "#[0-9a-fA-F]{3,8}\b|rgba?\(|slate-|white/|\[#" src` → solo `tokens.css`; `rg -n "material-symbols|Epilogue|DM Mono|hello@frxncismor|fade-in|grain" src public` → 0; sin imports/variables sin usar.
- [ ] T-059 Cierre — auditoría de i18n: recorrer `/`, `/blog` y los 6 artículos en ES y confirmar 0 textos de interfaz en inglés.
- [ ] T-060 Cierre — auditoría de accesibilidad y criterios de terminado del handoff: foco/teclado en todo, contraste ≥ 4.5:1 en los dos temas (tabla con valores), 0 scroll horizontal a 390px en `/`, `/blog` y los 6 artículos, reduced-motion, `lang` de `<html>` correcto.
- [ ] T-061 Cierre — `npm run build` limpio y comparación final con `docs/redesign/prototype.html` en ambos temas; actualizar `README.md` (stack/fuentes/tema) si algo ya no es cierto.

**Qué debe ver Paco en local**
- `/blog/values-vs-references-in-javascript` (y al menos un post largo, `/blog/from-frontend-to-full-stack`) en **1280px/390px**, **oscuro/claro**, **ES/EN**.
- Cabecera con tema, fecha, tiempo de lectura, título y dek; índice lateral que resalta la sección al hacer scroll (oculto ≤900px); barra de progreso; texto 18px/680px.
- Bloques de código con lenguaje y botón Copy ("Copied"); colores de sintaxis cambian con el tema; blockquote como callout.
- Pie con "Anterior" (más antiguo) y "Siguiente" (más nuevo).
- Cierre: `/llms.txt` con `frxncismor@gmail.com`; la og-image nueva (`/og-image.svg`); barrido de colores fijos limpio; todo `/` y `/blog` sin texto en inglés al elegir ES.
- Comprobaciones: build verde, greps de T-058, Tab completo, reduced-motion.

---

## Dependencias y orden

- Paradas secuenciales (1 → 6); cada una necesita el OK de Paco.
- Dentro de cada parada, `[P]` marca tareas en archivos distintos; T-001/T-002/T-003 (tokens, Tailwind, global) bloquean todo lo demás de la parada 1; T-008 (Layout) bloquea T-011/T-013.
- El texto de Room Tour no cambia en ninguna parada (to-do aparte).
- Al cerrar cada parada: `todo done` de su ítem en el to-do del proyecto; commit lo hace el orquestador al integrar con `Orq-Worktree.ps1`; push/PR solo con permiso de Paco.

## Resumen por parada

| Parada | Tareas | Rango | Criterio |
|---|---|---|---|
| 1 Base + Nav + Hero | 17 | T-001–T-017 | build verde, tema/i18n/menú, 0 colores fijos en lo tocado |
| 2 Work + Process | 9 | T-018–T-026 | build verde, 4 proyectos, Room Tour sin cambio de texto |
| 3 Experience + Toolkit | 6 | T-027–T-032 | build verde, orden y datos de Experience |
| 4 Writing + Templates + About + Contact | 9 | T-033–T-041 | build verde, 3 últimos posts, copiar correo |
| 5 Blog lista | 7 | T-042–T-048 | build verde, filtros que ocultan de verdad |
| 6 Blog artículo + cierre | 13 | T-049–T-061 | build verde, llms.txt, og-image, barrido, auditorías |
