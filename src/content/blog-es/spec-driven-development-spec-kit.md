---
title: "Desarrollo guiado por especificaciones con Spec Kit"
description: "Cómo uso Spec Kit de GitHub para convertir una petición vaga en spec, plan y tareas pequeñas antes de que el agente escriba código, y dónde falla."
date: 2027-02-01
category: "AI"
draft: false
---

# Desarrollo guiado por especificaciones con Spec Kit: spec, plan y tareas

**TL;DR:** Los agentes de código implementan lo que entendieron, no lo que querías. Spec Kit obliga a tener tres puntos de control escritos (spec, plan, tareas) antes de que exista código, más una constitución con reglas que el agente no negocia. Rinde en features que tocan varios archivos y sobra en un cambio de una línea.

## El problema: el agente construye lo que entendió

Escribes "agrega una forma de cancelar un pedido" y el agente devuelve algo razonable. Eligió un nombre de estado, decidió que los reembolsos quedan fuera y se saltó el caso del pedido ya enviado. Nada de eso lo decidiste tú, y te enteras en el review.

En [Cómo es ser desarrollador web en 2026](/es/blog/web-dev-in-2026-with-ai/) describí un ciclo donde yo defino el spec y el agente implementa. Ese post le dedica una sección a "spec primero". Este es la versión práctica con [Spec Kit](https://github.com/github/spec-kit), el toolkit open source de GitHub para ese flujo.

## El flujo y qué produce cada fase

Spec Kit trae una CLI, `specify`, que prepara el proyecto, y un conjunto de slash commands (skills) que ejecutas dentro de tu agente. Verifiqué los nombres actuales en el README y el quickstart: se escriben con guion, `/speckit-*`. Material más viejo usa la forma con punto (`/speckit.specify`), así que revisa cuál expone tu versión instalada.

Instalar e inicializar:

```bash
uv tool install specify-cli
specify init orders-demo --integration copilot
cd orders-demo
```

`--integration` elige el agente. Si lo omites, `init` te pregunta. Yo uso Claude Code, así que elijo esa integración; la documentación usa Copilot en sus ejemplos y lista las demás claves en el índice de integraciones.

Los comandos, en orden:

| Comando | Para qué | Salida |
|---|---|---|
| `/speckit-constitution` | Principios del proyecto, una vez | Archivo de constitución |
| `/speckit-specify` | Qué construir y por qué, sin stack | `spec.md` |
| `/speckit-clarify` | Preguntas sobre lo ambiguo, integradas al spec | `spec.md` actualizado |
| `/speckit-plan` | Cómo construirlo con tu stack | `plan.md` |
| `/speckit-tasks` | Elementos de trabajo pequeños y ordenados | `tasks.md` |
| `/speckit-analyze` | Revisión de consistencia de solo lectura | Reporte |
| `/speckit-implement` | Ejecuta las tareas | Código |
| `/speckit-converge` | Compara el código con spec, plan y tareas y agrega lo que falta | Tareas nuevas |

También existe `/speckit-checklist`: genera una lista tipo "unit tests para tus requisitos" que revisa una persona. Marcar un elemento no significa que el código esté terminado.

El spec describe comportamiento y restricciones. El plan es donde viven las decisiones de tecnología. Separarlos es la idea: si el spec ya dice "tabla en PostgreSQL", te saltaste el paso donde podías discrepar.

## Un ejemplo de punta a punta

La petición, con un dominio inventado: los clientes deben poder cancelar un pedido.

```text
/speckit-specify Los clientes pueden cancelar un pedido mientras esté
pendiente o pagado. Un pedido enviado no se puede cancelar. Cancelar un
pedido pagado genera una solicitud de reembolso. Si se rechaza la
cancelación, mostrar al cliente una razón clara.
```

El agente escribe un `spec.md` con historias de usuario y escenarios de aceptación. Después corro `/speckit-clarify`, y aquí aparece el valor. Pregunta cosas como: ¿se puede cancelar un pedido con un artículo parcialmente enviado? ¿El reembolso es automático o lo aprueba soporte? Respondo, y las respuestas quedan escritas en el spec en lugar de vivir en un chat que voy a perder.

Luego el plan:

```text
/speckit-plan Frontend Angular 21, API Fastify, PostgreSQL con Drizzle.
La cancelación es una transición de estado en la tabla orders existente.
```

Eso produce `plan.md` y, según la versión, archivos de apoyo como modelo de datos, contratos y quickstart. Después `/speckit-tasks` parte el plan en una lista ordenada:

```text
T001 Agregar columnas `cancelled_at` y `cancel_reason` (migración)
T002 Agregar función de dominio `cancelOrder(orderId)` con reglas de estado
T003 Test: un pedido enviado se rechaza con razón `ALREADY_SHIPPED`
T004 Ruta POST /orders/:id/cancel
T005 Botón de cancelar y mensaje de rechazo en el detalle del pedido
```

Antes de `/speckit-implement` corro `/speckit-analyze`. Es de solo lectura y reporta conflictos entre los tres documentos, por ejemplo una tarea que ningún requisito pide, o un requisito sin tarea. Arreglarlo cuesta minutos; arreglarlo después de implementar cuesta un ciclo de review.

Al terminar la implementación, `/speckit-converge` compara el código contra los documentos y agrega como tareas nuevas lo que falte. El README indica repetir implement y converge hasta que reporte `Converged`.

Una nota práctica sobre la estructura: el árbol de directorios generado ha cambiado entre versiones de Spec Kit (la documentación antigua describe `specs/<nombre-de-rama>/` con `spec.md`, `plan.md`, `tasks.md` y extras; el quickstart actual registra la feature activa en `.specify/feature.json`). Corre `specify init` en un directorio de prueba y míralo tú, en vez de confiar en un blog, incluido este.

## La constitución: reglas que el agente no negocia

La constitución se escribe una vez por proyecto con `/speckit-constitution`, y cada fase posterior debe respetarla. Es el lugar para las decisiones que si no repetirías en cada prompt. La mía para un proyecto TypeScript se ve así:

```text
/speckit-constitution Principios: TypeScript estricto sin any implícito;
todo cambio de comportamiento lleva un test de Vitest escrito primero;
ninguna dependencia nueva sin una línea en el plan que explique por qué;
cambios de base de datos solo con migraciones de Drizzle; funciones
pequeñas con nombres del dominio.
```

El documento de metodología de Spec Kit describe artículos constitucionales como test-first y simplicidad, por ejemplo un tope de proyectos en la primera implementación. No tienes que adoptarlos. Escribe solo reglas que vas a hacer cumplir, porque una constitución llena de aspiraciones le enseña al agente que las reglas son opcionales.

## Dónde se equivoca el flujo

**Specs inflados.** Si lo dejas, un agente convierte una petición de dos líneas en doce historias con casos borde que nadie pidió. Recorto el spec antes de planear. Si un escenario no cambiaría ninguna decisión, se va.

**Tareas demasiado grandes.** "Implementar la cancelación" no es una tarea. Una buena tarea cabe en un commit y una corrida de tests. Si una tarea toca más de unos pocos archivos, la divido y vuelvo a correr `/speckit-analyze`.

**Deriva del plan.** El agente encuentra incómodo el plan durante la implementación y se desvía en silencio. `/speckit-converge` detecta trabajo faltante, pero igual leo el diff contra `plan.md`.

**Clarify omitido.** Las preguntas se sienten como fricción y la gente las salta. Es la fase que más retrabajo elimina.

**Documentos que nadie lee.** Si aceptas la salida sin leerla, agregaste ceremonia sin ganar control. Los puntos de control solo funcionan si de verdad los revisas.

## Cuándo no usarlo

Para una errata, una actualización de dependencia, renombrar una variable o un bug pequeño con causa obvia, escribir un spec cuesta más que el cambio. Mi regla: si puedo describir todo el cambio y sus tests en dos frases, me salto Spec Kit. Si de otro modo empezaría una conversación larga con el agente, empiezo con `/speckit-specify`.

## Puntos clave

- Spec Kit vuelve explícitas y revisables tres decisiones antes del código: qué (spec), cómo (plan) y en qué orden (tareas).
- Los slash commands son `/speckit-*` en la documentación actual; confirma la forma que usa tu versión.
- `/speckit-clarify` y `/speckit-analyze` son los lugares más baratos para cazar errores.
- Escribe una constitución corta con reglas que vayas a hacer cumplir, una vez por proyecto.
- Recorta specs inflados y tareas enormes; salta todo el flujo en cambios triviales.

## Lecturas recomendadas

- [github/spec-kit](https://github.com/github/spec-kit): repositorio y README
- [Quickstart de Spec Kit](https://github.github.io/spec-kit/quickstart.html): instalación, `specify init` y la secuencia de comandos
- [Metodología de spec-driven development](https://github.com/github/spec-kit/blob/main/spec-driven.md): el razonamiento y los artículos constitucionales
- [Cómo es ser desarrollador web en 2026](/es/blog/web-dev-in-2026-with-ai/): cómo encaja en mi flujo diario
