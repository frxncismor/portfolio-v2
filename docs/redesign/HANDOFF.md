# Rediseño de frxncismor.dev — instrucciones para Claude Code

Quiero rediseñar mi portafolio y mi blog en el código que ya tengo. En esta carpeta está todo lo que necesitas:

| Archivo | Para qué sirve |
| --- | --- |
| `prototype.html` | Prototipo completo y funcional: página principal, lista del blog y artículo. **Es la referencia visual exacta.** Ábrelo en el navegador y prueba los dos temas. |
| `tokens.css` | Variables de color, sombra, tipografía y radios para los dos temas. |
| `logos/` | Logo principal (`lockup-h`), monograma (`monogram`) y avatar/favicon (`avatar`), cada uno en versión dark y light. |

## Cómo quiero que lo hagas

1. Primero lee mi repositorio y dime qué framework y estructura usa. **Implementa el diseño dentro de ese stack**; no lo migres a otro.
2. Antes de tocar código, propón un plan: qué componentes vas a crear o modificar y en qué orden.
3. Pasa `tokens.css` a la forma que use el proyecto (CSS global, Tailwind theme, SCSS, etc.). Ningún componente lleva colores fijos: todo usa tokens.
4. Trabaja por secciones y muéstrame cada una antes de seguir: layout y navbar → hero → work → process → experience → toolkit → writing → templates → about → contact → blog (lista) → blog (artículo).
5. Conserva el contenido y las rutas actuales del blog. Solo cambia el diseño de la lista y del artículo; los artículos siguen saliendo de donde salen hoy.
6. Mantén la versión en español (botón ES/EN) si el sitio ya la tiene; el prototipo solo muestra los textos en inglés.

## Sistema visual

- **Dirección:** minimalista editorial. Mucho espacio, un solo color de acento (verde pino), líneas de 1px en lugar de sombras, y nada de morados, degradados, resplandores o emojis.
- **Tipografía (Google Fonts):**
  - `Fraunces` en peso 400 con `font-variation-settings: "SOFT" 100, "WONK" 1` y `opsz` según el tamaño. Es para titulares y el logo. Nunca en negrita, cursiva ni subrayado.
  - `Geist` 400/500 para todo el texto de lectura.
  - `Geist Mono` 500 para etiquetas pequeñas en mayúsculas con `letter-spacing: .08em`, y para el código.
- **Temas:** el oscuro es el principal. El claro se activa con `prefers-color-scheme: light` o con `data-theme="light"` en `<html>`. El botón sol/luna guarda la elección en `localStorage`. Aplica el tema en un script dentro de `<head>`, antes del primer pintado, para que no parpadee.
- **Espaciado:** 96–112px entre secciones, contenedor de 1120px y un margen lateral mínimo de 16px en móvil.
- **Radios:** 4px en tags, 10px en botones y bloques de código, 16px en tarjetas e imágenes.
- **Sombras:** solo `--shadow-sm` en hover de tarjetas y `--focus` como anillo de foco (`:focus-visible`).

## Estructura de la página principal

1. **Navbar** (fija): logo `FM. │ Francisco Moreno` hecho en texto/CSS, con **solo 4 enlaces** (Work, Experience, Blog, Contact), selector ES/EN, botón de tema y la píldora "Open to full-time" con un punto que late despacio. En pantallas de menos de 640px el logo se reduce a `FM.`.
2. **Hero:** sin foto. Arriba, la etiqueta "Francisco Moreno — Software Engineer · Houston, TX". El titular es *"I build software for Disney, Royal Caribbean, United Airlines and OXXO."*, con las marcas en `--accent`. Cada coma va pegada a su marca (no puede quedar sola al inicio de una línea). Después, los botones "See my work" y "View experience" y la línea "Angular · .NET & Node · AI-assisted, human-reviewed".
3. **Franja "Shipped for":** Disney, Royal Caribbean, United Airlines, OXXO, Dick's Sporting Goods, Gannett y RegioLabs, en Fraunces.
4. **Work:** cuadrícula de 2 columnas con imágenes 4:5; la columna derecha baja 96px (feed escalonado). Proyectos: **Grim Builds** (builds de Grim Dawn hechas por la comunidad; portada con una constelación), Nox Coffee, Room Tour y Mega Basic Crossy Road. Las portadas del prototipo son ilustraciones en CSS/SVG: si tengo capturas reales, úsalas.
5. **How I work:** cuatro tarjetas (Spec, Harness, Review, Observe), cada una con una "ventana" de entregable **simulado** (spec.md, corrida del agente, checklist de revisión y gráfica de producción). Debajo va el ciclo circular con "Every release improves the next." Copia los textos del prototipo.
6. **Experience:** filas separadas por líneas. Primero Valtre (Now, API para OXXO), luego Globant (5 years, Senior Software Engineer, con sus clientes). En Freelance & independent: RegioLabs (con enlace a regiolabs.com.mx), Caro Sweet MUA y Vaneybr.
7. **Toolkit:** cuatro grupos de chips: Frontend, Backend & data (incluye .NET 10, Prisma y Oracle), AI workflow (Claude Code, MCP servers, Agent skills, Spec-driven dev, Harness engineering, Human-in-the-loop) y Ship & observe (incluye ARO).
8. **Latest from the blog:** los 3 artículos más recientes, sacados de los datos reales del blog.
9. **Templates:** ZooNova, $25, con enlace a Gumroad.
10. **About:** cita, dos párrafos y 3 cifras (6 años, 6 marcas globales, 20+ herramientas).
11. **Contact:** titular grande, correo **frxncismor@gmail.com** con botón para copiar, y enlaces a GitHub y LinkedIn.

## Blog

- **Lista:** titular, buscador y filtros por tema (All, Backend, AI, Angular, JavaScript) que funcionan. Luego, el artículo más reciente destacado en una tarjeta grande y el resto en filas: fecha | título + resumen | etiqueta.
- **Artículo:**
  - Enlace "← All posts", tema, fecha, tiempo de lectura, título grande y una frase de entrada.
  - Índice lateral fijo que resalta la sección actual (se oculta en pantallas de menos de 900px).
  - Barra de progreso de lectura bajo la navbar.
  - Texto en Geist a 18px y 680px de ancho máximo.
  - Bloques de código con nombre de archivo, botón Copy y colores de sintaxis de `tokens.css`.
  - Callout para ideas clave y, al final, tarjetas de artículo siguiente y anterior.

## Movimiento

- Al hacer scroll, cada bloque aparece con opacidad y un desplazamiento de 10px, en 500ms con `cubic-bezier(.2,.7,.2,1)`, una sola vez. Los elementos de una lista se escalonan 60ms.
- El titular del hero entra palabra por palabra, con 50ms entre cada una.
- En hover solo cambian el color y el borde, la tarjeta sube 3px y la flecha se mueve 2–3px. Nada de escalados ni rebotes.
- Respeta `prefers-reduced-motion`: con esa opción no hay animaciones.

## Lo que falta o hay que confirmar

- Las capturas reales de los proyectos, que reemplazan las ilustraciones.
- Los enlaces reales de GitHub, LinkedIn, Gumroad y los proyectos (en el prototipo son marcadores).
- El stack de Grim Builds (la tarjeta aún no lo muestra).
- Mi puesto exacto en Valtre (el prototipo dice "Software Engineer").
- El favicon: usa `logos/avatar-dark.svg`.

## Criterios de terminado

- Coincide visualmente con `prototype.html` en ambos temas, en escritorio y a 390px de ancho.
- Ninguna página tiene scroll horizontal.
- Navegación completa con teclado y foco visible.
- El contraste del texto es de al menos 4.5:1 en los dos temas.
- No quedan colores fijos fuera de los tokens.
