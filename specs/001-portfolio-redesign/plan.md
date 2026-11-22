# Implementation Plan: Rediseño visual del portfolio

**Branch**: `001-portfolio-redesign` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)
**Input**: `specs/001-portfolio-redesign/spec.md`, `docs/redesign/*`, `runs/11221608/rediseno-plan.md` (§3, §4, §6) y los reportes de los exploradores.

## Summary

Implementar el diseño de `docs/redesign/prototype.html` en el stack actual sin migrar. Los tokens del handoff pasan a
variables CSS (`src/styles/tokens.css`) que Tailwind consume como colores `var(--…)`; el tema vive en `data-theme` con un
script en `<head>`; el i18n actual (`data-i18n` + `.lang-en/.lang-es` + datos `{en,es}`) se amplía; el blog gana
tiempo de lectura, índice, progreso, copiar código y callouts; el movimiento se reescribe con `prefers-reduced-motion`.
Se entrega en **6 paradas** revisables por separado.

## Technical Context

**Language/Version**: TypeScript 5.9 (estricto, `astro/tsconfigs/strict`, alias `@/*`), Astro 4.16.19, JS vanilla en cliente
**Primary Dependencies**: `astro`, `@astrojs/tailwind` 5.1.5 (Tailwind 3.4.19), `@astrojs/sitemap`. **Sin nuevas dependencias.**
**Storage**: archivos (`src/data/*.ts`, colecciones Markdown `blog-en`/`blog-es`); `localStorage` (`fm-theme`, `lang`) solo como preferencia
**Testing**: no hay tests ni lint. Verificación = `npm run build` + greps + revisión manual en `npm run dev` (390/1280px, claro/oscuro, ES/EN, teclado, reduced-motion)
**Target Platform**: sitio estático en Vercel; navegadores evergreen (usa `color-mix`, `text-wrap:balance`, `:focus-visible`)
**Project Type**: web estática (frontend único)
**Performance Goals**: sin JS de librerías; scripts de cliente pequeños (<10KB conjunto); fuentes con `display=swap` y `preconnect`
**Constraints**: AGENTS.md (TS sin `any` implícito, tokens, PascalCase/camelCase, frontmatter mínimo); ES/EN; 0 colores fijos; sin scroll horizontal a 390px
**Scale/Scope**: 3 rutas (`/`, `/blog`, `/blog/[slug]` ×6 posts), ~20 componentes, ~120 cadenas nuevas EN/ES

## Constitution Check

| Principio | Cumple | Nota |
|---|---|---|
| I Stack fijo | Sí | Sin dependencias nuevas |
| II Tokens | Sí | `--art-*` y `--syn-*` extienden `tokens.css`; barrido de greps en cierre |
| III Bilingüe | Sí | Tabla i18n abajo |
| IV Accesible / reduced-motion | Sí | Tareas explícitas en cada parada |
| V Verificación por parada | Sí | `tasks.md` define build + qué debe ver Paco |
| VI Convenciones | Sí | PascalCase componentes, datos camelCase, sin `any` |

## Arquitectura

### Tokens y Tailwind
- `src/styles/tokens.css`: `:root` (oscuro), `@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) }` y `:root[data-theme="light"]`; añade `--art-*` (paleta de ilustración: `ember #D9926D`, `ink-warm #2A1E18`, `night #120F0D`, `cream #E9DCC8`, `pine #2F5D50`, `pine-dark #263F37`, `road #3A3D38`, `mist #DCE7E2`, `wall-l #B9CCC4`, `wall-r #8CB8A8`, `ceiling #EFECE5`, `paper-art #F7F5F0`, `tag-bg`, etc. — los valores del prototipo, **idénticos en ambos temas** porque las portadas son arte) y `--syn-*`/`--code-bg` por tema. `--focus` se define con `var()` en vez de repetir hex.
- `tailwind.config.mjs`: **sustituye** la paleta morada por `paper, surface, sunken, ink, muted, hairline, accent, 'accent-soft', 'on-accent', clay, deep` = `var(--x)`; añade `art.*` = `var(--art-x)`; `borderRadius` `sm/md/lg` = 4/10/16 (variables); `fontFamily` `display/sans/mono`; `maxWidth.wrap: 1120px`; `boxShadow` `sm`/`focus`. `darkMode` se cambia a `['selector', '[data-theme="dark"]']` solo si hace falta (previsto: no se usa `dark:`; todo va por variables).
- `global.css` pasa a incluir un reset mínimo (hoy `applyBaseStyles:false`), `.wrap`, `.label`, `.serif`, `.btn`, `.link`, `.chip`, `.topic`, `.reveal`, `[hidden]`, `:focus-visible`, `.sr-only`, `.prose`/`.code`/`.callout`, `@media (scripting: none)` y `@media (prefers-reduced-motion: reduce)`.

### Fuentes
Un solo `<link>` (con `preconnect` a googleapis y gstatic): `Fraunces:opsz,wght,SOFT,WONK@9..144,400,100,1`, `Geist:wght@400;500`, `Geist+Mono:wght@400;500`. Se mantiene el patrón no bloqueante actual y un `@font-face` de fallback con `size-adjust` para evitar saltos. **Corrección**: `.grim-title` usa SOFT 100 como el resto (SOFT va fijo). Se quitan Epilogue, DM Mono y Material Symbols.

### Tema
Script inline en `<head>` **antes** de los `<link>` de estilos: lee `localStorage['fm-theme']` (try/catch) y pone `data-theme` en `<html>`; `<meta name="theme-color">` doble con `media`. `ThemeToggle.astro` alterna y guarda; muestra sol/luna por CSS según el tema efectivo; `aria-pressed`/`aria-label` traducidos.

### i18n
Se mantiene el mecanismo actual. Reglas:
| Tipo de texto | Mecanismo |
|---|---|
| Cadena corta sin marcado (labels, botones, títulos de sección) | `data-i18n="clave"` + `translations.ts` |
| Bloques con marcado (titular del hero palabra a palabra, cita de About con `<em>`, párrafos con enlaces) | Dos copias `.lang-en` / `.lang-es` en el propio componente |
| Datos (proyectos, experiencia, toolkit, process, templates, about) | `{ en: string; es: string }` tipado (`type Localized`) y el componente emite ambos con `.lang-*` |
| Atributos (`aria-label`, `placeholder`, `title`) | `data-i18n-aria` / `data-i18n-placeholder` (se añade `aria-label` al soporte de `i18n.ts`) |
Se cierra con una auditoría de cadenas sin traducir (parada 6). Se añade `try/catch` a `localStorage` en `i18n.ts` y al script del `<head>`.

### Movimiento
`animations.ts` se reescribe: `.reveal` con `IntersectionObserver` (solo a los que están bajo el pliegue, como el prototipo), `rootMargin 0 0 -8% 0`, escalonado `min(i,4)*60ms`, una sola vez; sin JS o con reduced-motion todo visible. El hero es CSS puro (`@keyframes rise`, 50ms por palabra, `animation-delay` inline). La píldora late con `@keyframes pulse`. Reduced-motion anula animation/transition y `scroll-behavior`.

### Marca
`public/brand/{avatar,monogram,lockup-h}-{dark,light}.svg`; favicon `<link rel="icon" href="/brand/avatar-dark.svg" media="(prefers-color-scheme: dark)">` y variante light; `public/favicon.svg` se sustituye por el avatar. `Logo.astro` (texto Fraunces + CSS) para navbar y footer. `og-image.svg` se rehace (1200×630, fondo `paper` oscuro, lockup + línea de acento, sin morado) y el meta `og:image` se mantiene en `/og-image.svg`; ver duda sobre PNG.

### Blog
- `lib/readingTime.ts`: `Math.max(1, Math.ceil(words/200))` sobre `post.body`.
- Índice: `const { Content, headings } = await post.render()`; se filtra `depth === 2`. Los `id` los genera Astro (`rehype-slug` ya incluido). `Toc.astro` + `scripts/article.ts` (scroll-spy y clic con `scrollIntoView`).
- Shiki: `markdown.shikiConfig.theme = 'css-variables'` en `astro.config.mjs`; `global.css` mapea `--astro-code-token-*` a `--syn-*`. `scripts/article.ts` envuelve cada `pre.astro-code` en `figure.code` con `figcaption` (lenguaje desde `data-language`; `title` opcional por convención de la primera línea del bloque, ver duda) y botón Copy.
- `blockquote` → callout por CSS en `.prose`.
- Lista: `FeaturedPost.astro` + `PostRow.astro`; filtros generados desde las categorías reales; `blog.ts` ajustado a `hidden` y a incluir el destacado. `BlogCard.astro` se elimina.
- Prev/next: ordenados por fecha; `prev` = más antiguo, `next` = más nuevo.

## Enfoques considerados

| Decisión | Opción A (elegida) | Opción B | Coste / por qué |
|---|---|---|---|
| Tokens | Variables CSS + colores Tailwind `var(--x)` | Paleta fija en `tailwind.config` + `dark:` | A: un cambio de tema = un atributo, 0 duplicación, cumple "ningún color fijo". B: duplica cada clase y no sirve para SVG. |
| Tema | `data-theme` + `prefers-color-scheme` en CSS, script en `<head>` | `class="dark"` de Tailwind | A coincide con `tokens.css` y el handoff; B obliga a reescribir los tokens. |
| i18n | Mantener `data-i18n` + `.lang-*` + datos `{en,es}` | Rutas `/es` o librería i18n | Mantener = cero cambio de arquitectura y SEO; rutas `/es` fuera de alcance. |
| Marcado traducible | Bloques `.lang-en/.lang-es` para HTML con spans | `data-i18n` con `innerHTML` | `textContent` rompe los `<span>` del hero; `innerHTML` abre riesgo y complica el stagger. |
| Resaltado de código | Shiki `css-variables` mapeado a `--syn-*` | Tema fijo de Shiki | Un tema fijo pondría colores literales en HTML y no cambiaría con el tema. |
| Código con nombre de archivo | Etiqueta con lenguaje, `title` opcional | Reescribir los posts | No se toca el contenido de los posts (fuera de alcance). |
| Iconos | SVG inline | Material Symbols | Se quita una fuente externa de ~1MB y las ligaduras de texto. |
| Portadas | CSS/SVG con `--art-*` en `ProjectCover.astro` | Capturas / imágenes raster | No hay capturas (decisión 6). |
| Menu móvil | Botón "Menu" con `<details>`-like (botón + panel) en `Nav` | Hamburguesa con drawer | Decisión 2: "sencillo". Panel desplegable bajo la navbar. |
| Entrega | 6 paradas en worktrees integrados | Un PR único | Decisión 4. |

## Correcciones al prototipo (huecos resueltos)

1. Tema en `<head>`, no al final del `<body>`.
2. Todo el texto ES/EN (el prototipo no tiene ES).
3. ES/EN visible ≤640px; Menu ≤900px.
4. `[hidden]{display:none!important}` para que filtren los filtros del blog.
5. Colores fijos de portadas, `.tag` y nodo SPEC → `--art-*`/tokens.
6. Geist Mono 400 y 500 cargados; SOFT 100 también en `.grim-title`.
7. Writing = 3 posts reales más recientes por fecha, no los inventados.
8. Anterior/Siguiente: "Anterior" = más antiguo, "Siguiente" = más nuevo.
9. Código: lenguaje o `title` opcional; no se tocan los posts.
10. Rutas reales: se conservan los slugs actuales.
11. Cursiva sintética: se elimina `em` itálica en `.prose` salvo la que aporte el navegador con Geist; Fraunces nunca en cursiva ni subrayado (el botón "All topics" del estado vacío usa borde inferior en vez de subrayado).
12. `:focus-visible` sin `border-radius` global (conserva el radio del elemento).
13. El texto "ZooNova" pasa de `::after` a texto real.
14. `<html lang>` se mantiene sincronizado con el idioma, y se añaden viewport/favicon al layout (ya existen).

## Archivos

### Crear
`src/styles/tokens.css` · `src/components/{Logo,ThemeToggle,Clients,ProjectCover,Process,Toolkit,Writing}.astro` · `src/components/blog/{FeaturedPost,PostRow,Toc}.astro` · `src/data/{toolkit,process,about}.ts` · `src/lib/readingTime.ts` · `src/scripts/{article,contact,nav,theme}.ts` · `public/brand/*.svg` (6) · `src/i18n/types.ts` (tipo `Localized`).

### Modificar
`src/layouts/Layout.astro` · `src/components/{Nav,Hero,Work,ProjectCard,Experience,Templates,TemplateCard,About,Contact,Footer}.astro` · `src/pages/index.astro` · `src/pages/blog/index.astro` · `src/pages/blog/[slug].astro` · `src/styles/global.css` · `tailwind.config.mjs` · `astro.config.mjs` (Shiki) · `src/scripts/{animations,i18n,blog}.ts` · `src/i18n/translations.ts` · `src/data/{projects,experience,templates}.ts` · `public/{favicon.svg,og-image.svg,llms.txt}`.

### Eliminar
`src/components/BlogCard.astro` · `src/data/stack.ts` · grano y orbes del Hero (en `Hero.astro`/`global.css`) · Material Symbols (en `Layout.astro`/`global.css`).

### Conservar sin tocar
`src/content/**` (artículos y `config.ts`), `public/robots.txt`, `package.json` (sin dependencias nuevas).

## Estructura

```text
src/
├── components/        # Nav, Hero, Clients, Work, ProjectCard, ProjectCover, Process, Experience, Toolkit,
│   │                  # Writing, Templates, TemplateCard, About, Contact, Footer, Logo, ThemeToggle
│   └── blog/          # FeaturedPost, PostRow, Toc
├── data/              # projects, experience, toolkit, process, about, templates (todos con Localized)
├── i18n/              # translations.ts, types.ts
├── lib/readingTime.ts
├── scripts/           # animations, i18n, nav, theme, contact, blog, article
├── styles/            # tokens.css, global.css
├── layouts/Layout.astro
└── pages/             # index, blog/index, blog/[slug]
public/brand/          # avatar/monogram/lockup × dark/light
```

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Choque de contenido con `orq/11221608` (RegioLabs en Work, Caro Sweet en Work) | Medio | Se resuelve en la parada 2 (Work) y 3 (Experience); el handoff manda. |
| ~120 cadenas ES nuevas con tono inconsistente | Medio | Glosario en `tasks.md`; Paco revisa el ES en cada parada. |
| Parpadeo de tema/idioma | Medio | Scripts en `<head>`; se prueba recargando con tema guardado en cada parada. |
| Cursiva/pesos de fuente no cargados (síntesis) | Bajo | Cargar Geist Mono 400/500; no usar cursiva en Fraunces. |
| Shiki `css-variables` no pinta como el prototipo | Medio | Mapear todas las `--astro-code-token-*`; comparar con `prototype.html` en la parada 6. |
| Scroll horizontal por `code`/`pre`/chips en 390px | Medio | `overflow-x:auto` en `pre`, `min-width:0` en grids; comprobación 390px por parada. |
| `[hidden]` pisado por `display:grid` | Medio | Regla `[hidden]{display:none!important}` en `global.css` desde la parada 1. |
| Contraste del acento claro (#2F5D50) y `muted` | Bajo | Comprobado con tokens (≥4.5:1); se re-mide en cada parada. |
| Cambiar `applyBaseStyles` rompe estilos existentes durante las paradas intermedias | Medio | Cada parada migra los componentes que toca; los aún no migrados siguen compilando y se ven incompletos. Aviso a Paco: el sitio no es coherente hasta la parada 4. Alternativa: rama de integración única (ver duda 1). |
| Texto de Room Tour pendiente en 11221609 | Bajo | No se toca; solo la tarjeta. |

## Estrategia de pruebas (por parada)

1. `npm run build` verde.
2. Greps sobre lo tocado: `rg -n "#[0-9a-fA-F]{3,8}\b|rgba?\(|slate-|white/|\[#" <archivos>` → 0 (salvo `tokens.css`).
3. `npm run dev`: 1280px y 390px, oscuro y claro, ES y EN; sin scroll horizontal (`document.documentElement.scrollWidth <= innerWidth`).
4. Teclado: Tab recorre todo con foco visible; Menu abre/cierra con Enter/Esc.
5. Reduced-motion (DevTools → Rendering → `prefers-reduced-motion: reduce`): sin animaciones y contenido visible.
6. Contraste con los valores de tokens (herramienta de DevTools o cálculo) en ambos temas.
7. Recarga con `fm-theme`/`lang` guardados: sin parpadeo.
8. Comparación visual con `docs/redesign/prototype.html` abierto en paralelo.

## Preguntas para Paco (no bloqueantes)

1. **Integración entre paradas**: ¿cada parada se integra en `orq/11221608-redesign` (rama de integración única, el sitio queda a medias hasta la 4) o se integra solo al final? *Recomendado*: rama única, integrando parada a parada, PR a `main` al final.
2. **og-image**: se rehace en SVG (como hoy). Muchas redes sociales no aceptan SVG. *Recomendado*: generar también un PNG 1200×630 y usarlo en `og:image`.
3. **Título en `og-image` / `llms.txt`**: hoy dice "Senior Web UI Engineer"; el sitio dice "Software Engineer". *Recomendado*: "Full-Stack Software Engineer" en llms.txt y "Software Engineer" en og-image.
4. **llms.txt**: lista Kindnest y Contractors Project que ya no existen en `experience.ts`, y omite `from-frontend-to-full-stack`. *Recomendado*: alinearlo con los datos actuales y los 6 posts.
5. **Nombre de archivo en código**: los posts no lo tienen. *Recomendado*: lenguaje por defecto, y soportar `title="x.js"` en el fence si algún día se quiere.
6. **Ordenación de Experience**: `Caro Sweet MUA` y `Vaneybr` no tienen sitio web verificado en esta corrida; se usan las URLs de `experience.ts`.
7. **Cifras de About** (6 años, 6 marcas, 20+ herramientas): vienen del handoff. *Recomendado*: confirmarlas (Disney, Royal Caribbean, United, OXXO, Dick's, Gannett = 6; RegioLabs es cliente independiente).
