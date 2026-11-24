---
title: "Agentes de código en paralelo con git worktrees"
description: "Un worktree y una rama por agente, rama de integración, merges --no-ff, un techo de paralelismo razonable y limpieza. El patrón con git, paso a paso."
date: 2027-02-22
category: "AI"
cover: "worktrees"
draft: false
---

# Agentes de código en paralelo con git worktrees

**TL;DR:** Dos agentes editando el mismo checkout se pisan. Dale a cada agente su propio git worktree en su propia rama, junta su trabajo en una rama de integración con `--no-ff`, mantén el número de agentes dentro de lo que aguantan tu RAM y tu capacidad de review, y borra los worktrees al terminar.

## Por qué un solo checkout no alcanza

Describí mi setup diario en [Cómo es ser desarrollador web en 2026](/es/blog/web-dev-in-2026-with-ai/): el agente implementa, yo reviso. El siguiente paso es obvio. Si un agente sirve, tres agentes en tres tareas independientes deberían ir más rápido.

Y van más rápido, siempre que no compartan directorio de trabajo. En un solo checkout, la edición a medias del agente A rompe la corrida de tests del agente B, `git status` muestra una mezcla de ambos, y un `git checkout` de uno cambia en silencio los archivos del otro. No sabes qué cambio es de quién.

Un [git worktree](https://git-scm.com/docs/git-worktree) lo resuelve sin clonar el repositorio tres veces. Cada worktree enlazado tiene sus propios archivos, `HEAD` e index, y comparte el historial y todas las refs bajo `refs/`.

## Los comandos de git

Todo lo de abajo es git estándar. Verifiqué cada comando contra el [manual de git-worktree](https://git-scm.com/docs/git-worktree).

```bash
# Create a worktree at ../shop-orders-api on a new branch, starting from HEAD
git worktree add -b feat/orders-api ../shop-orders-api

# Same, but start from a specific base
git worktree add -b feat/orders-ui ../shop-orders-ui integration/orders

# See what exists
git worktree list

# Remove a clean worktree
git worktree remove ../shop-orders-api

# Forget metadata for worktree directories deleted by hand
git worktree prune --dry-run
git worktree prune
```

Lo que importa en la práctica:

- `-b <rama>` crea una rama nueva y la deja en el nuevo worktree; se niega si la rama ya existe (`-B` la reinicia, úsalo con cuidado).
- Por defecto, `add` se niega a hacer checkout de una rama que otro worktree ya tiene. Una rama, un worktree. Es una ventaja: evita que dos agentes compartan rama.
- `git worktree remove` solo borra worktrees limpios (sin archivos untracked ni cambios en archivos tracked). `--force` lo anula y tira el trabajo sin commit.
- `git worktree list` marca un worktree como `prunable` cuando su directorio ya no existe, y `git worktree prune` limpia esa metadata. Prefiere `remove` a borrar carpetas a mano.
- Si un worktree vive en un disco que no siempre está montado, `git worktree lock` evita que se limpie automáticamente.

## El patrón

Uso una rama por agente más una rama de integración.

```text
main
 └─ integration/orders        <- donde aterriza el trabajo terminado
     ├─ feat/orders-api       <- agente 1, worktree ../shop-orders-api
     ├─ feat/orders-ui        <- agente 2, worktree ../shop-orders-ui
     └─ test/orders-e2e       <- agente 3, worktree ../shop-orders-e2e
```

Preparación:

```bash
git switch -c integration/orders main

git worktree add -b feat/orders-api  ../shop-orders-api  integration/orders
git worktree add -b feat/orders-ui   ../shop-orders-ui   integration/orders
git worktree add -b test/orders-e2e  ../shop-orders-e2e  integration/orders
```

Cada agente arranca en su propio directorio. En un worktree nuevo las dependencias no están instaladas (`node_modules` no está versionado), así que corre ahí el paso de instalación. Dile a cada agente qué rutas le tocan; el corte más limpio es por área del código, no por capa del mismo archivo.

Cuando un agente termina y ya revisé su diff, lo integro:

```bash
git switch integration/orders
git merge --no-ff feat/orders-api -m "feat(orders): add cancel endpoint"
```

Uso `--no-ff` a propósito. Registra un commit de merge aunque se pudiera hacer fast-forward, así el historial muestra qué trabajo de qué agente llegó y cuándo, y revertir la contribución de un agente es un solo `git revert -m 1 <merge>`. Las ramas de agente viven poco, así que los commits de merge extra no cuestan nada.

Corre toda la suite de tests en `integration/orders` después de cada merge, no solo en el worktree del agente. Dos ramas pueden pasar sus tests por separado y aun así chocar en comportamiento.

Cuando la rama de integración está en verde, va a `main` por pull request como cualquier otro cambio.

## Cuántos agentes a la vez

Más agentes no es mejor pasado cierto punto, y el techo tiene dos causas.

**Recursos de la máquina.** Cada worktree es un checkout completo con su `node_modules`, su dev server, su test runner y su proceso de agente. Un build de Angular más un watcher de Vitest más un navegador de Playwright por worktree suman rápido. Revisa la RAM libre antes de lanzar otro agente, empieza con dos o tres y agrega más solo mientras los builds y los tests sigan rápidos. Si la máquina empieza a usar swap, ya pasaste el techo.

**Tu capacidad de review.** Cada agente produce un diff que tienes que leer. Si no puedes revisar tan rápido como producen, la cola solo se mueve hacia ti, y el trabajo sin revisar es de donde salen las regresiones. En la práctica el cuello de botella real suele ser tu capacidad de revisar, no el hardware, así que ajusta el número de agentes a lo que puedas leer con cuidado.

También chocan los recursos compartidos aunque los archivos no: dos dev servers en el mismo puerto, dos corridas de tests contra la misma base de datos local. Dale a cada worktree su propio puerto y nombre de base de datos con un `.env` sin versionar, o el aislamiento queda a medias.

## Conflictos

Los worktrees evitan colisiones al editar; no evitan conflictos al hacer merge. Dos agentes que tocan `package.json`, un archivo de rutas o un tipo compartido van a chocar cuando integres el segundo.

Lo que ayuda:

- Divide las tareas por límites de archivos antes de empezar, y dilo en las instrucciones de cada agente.
- Mete primero el cambio compartido (un tipo nuevo, una dependencia) en la rama de integración y de ahí ramifica a los agentes.
- Haz merges pequeños y frecuentes. Integra la rama de cada agente al terminar, no al final del día.
- Si aparece un conflicto, resuélvelo en la rama de integración, no en el worktree de un agente, y vuelve a correr los tests.
- Tras integrar a un agente, haz rebase o merge de la rama de integración en los agentes que siguen trabajando si dependen del cambio.

## Claude Code y los worktrees

Claude Code lo soporta de forma nativa. `claude --worktree <nombre>` crea un worktree en `.claude/worktrees/<nombre>/` sobre una rama nueva llamada `worktree-<nombre>` y abre una sesión ahí. Por defecto ramifica desde la rama por defecto del repositorio, y un ajuste (`worktree.baseRef`) permite cambiarlo a tu `HEAD` actual. Los subagentes personalizados también pueden declarar `isolation: worktree` en su frontmatter. Puedes agregar un archivo `.worktreeinclude` para copiar a cada worktree nuevo archivos ignorados por git, como `.env`. Consulta la [documentación de worktrees de Claude Code](https://code.claude.com/docs/en/worktrees.md) para el comportamiento exacto.

El comando integrado es cómodo para sesiones independientes. Yo sigo usando `git worktree add` cuando quiero una rama base concreta (la de integración, por ejemplo) o un worktree fuera de la carpeta del repositorio, que la documentación también describe como el caso de gestión manual.

## Limpieza

Los worktrees se acumulan. Cuando el trabajo ya está integrado:

```bash
git worktree remove ../shop-orders-api
git branch -d feat/orders-api
git worktree list
git worktree prune
```

`git branch -d` solo borra una rama ya integrada, lo cual es una verificación gratis. Si `remove` se niega porque el worktree no está limpio, lee qué quedó antes de usar `--force`: o es trabajo que olvidaste commitear o son archivos que puedes perder sin problema.

En los worktrees que crea Claude Code, borra automáticamente los limpios cuando termina una sesión sin nombre y te pregunta si hay trabajo dentro; las ejecuciones no interactivas no se limpian solas, así que bórralos tú.

## Puntos clave

- Un agente, un worktree, una rama; git mismo se niega a hacer checkout de la misma rama dos veces.
- Ramifica a los agentes desde una rama de integración y únelos con `--no-ff` para que cada contribución sea visible y revertible.
- El paralelismo lo limitan la RAM y qué tan rápido puedes revisar, no cuántas terminales puedes abrir.
- Aísla también puertos y bases de datos; los archivos son solo parte de lo que se comparte.
- Borra worktrees con `git worktree remove`, elimina las ramas integradas y limpia la metadata vieja con prune.

## Lecturas recomendadas

- [Manual de git-worktree](https://git-scm.com/docs/git-worktree): `add`, `list`, `remove`, `prune`, `lock`
- [Claude Code: sesiones paralelas con worktrees](https://code.claude.com/docs/en/worktrees.md): `--worktree`, aislamiento de subagentes y limpieza
- [Cómo es ser desarrollador web en 2026](/es/blog/web-dev-in-2026-with-ai/): el flujo sobre el que se construye esto
