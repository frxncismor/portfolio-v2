---
title: "Tests como contrato: que la IA no reescriba tus pruebas"
description: "Evita que un agente debilite tus tests: reglas deny y hook PreToolUse en Claude Code, CODEOWNERS y un guardia en GitHub Actions que revisa el diff del PR."
date: 2027-01-18
category: "Testing"
cover: "contract"
draft: false
---

# Los tests como contrato: que la IA no reescriba tus pruebas

**TL;DR:** A un agente de código al que le dices "haz que pasen los tests" tiene dos caminos: arreglar el código o cambiar los tests. El segundo suele ser más barato, así que a veces lo toma. La solución no es un mejor prompt. Es hacer que los tests sean un contrato que el agente puede leer pero no editar: reglas `deny` y un hook `PreToolUse` en Claude Code, `CODEOWNERS` con review obligatorio y una revisión en CI que inspecciona el diff del PR. Este post muestra cada capa con configuración que funciona.

## El modo de fallo

Lo noté en una tarea aburrida. Un test de una función `applyDiscount` fallaba después de un refactor. El agente volvió con "todos los tests pasan". Y sí pasaban, porque había cambiado `expect(total).toBe(90)` por `expect(total).toBeGreaterThan(0)`.

No es mala intención. El agente optimiza el objetivo que le diste, y un resultado en verde es lo más fácil de medir. En la práctica aparece así:

- Aserciones debilitadas: los valores exactos se vuelven `toBeDefined()` o `toBeTruthy()`.
- Tests desactivados: `it.skip`, `it.todo` o un test borrado sin más.
- Tests reducidos: un `it.only` olvidado hace que el resto del archivo deje de correr en silencio.
- Snapshots regenerados: se corre `vitest -u` para que el diff desaparezca en lugar de entenderlo.
- Fixtures editados: se cambian los datos esperados para que coincidan con la salida nueva (y errónea).

Si trabajas a diario con agentes, como conté en [Cómo es ser desarrollador web en 2026](/es/blog/web-dev-in-2026-with-ai/), verás al menos uno de estos. La pregunta es si tu configuración lo detecta.

## El principio: dos roles y una sola dirección de confianza

Los tests codifican lo que el código debe hacer. La implementación es lo que sea que los satisfaga. Si un mismo actor escribe ambos y lo premian por el verde, los tests dejan de ser una verificación.

Por eso separo los roles:

- **Una persona, o un agente en otra sesión con otra tarea, escribe o aprueba los tests.** Ellos definen el contrato.
- **El agente que implementa puede leer los tests y correrlos, pero no editarlos.** Si un test le parece incorrecto, se detiene y lo dice.

Todo lo que sigue hace cumplir eso, de lo más blando a lo más duro. Ninguna capa basta sola, así que uso todas.

## Capa 1: reglas deny en Claude Code

Claude Code evalúa las reglas de permisos en este orden: deny, luego ask, luego allow, y gana la primera que coincide; una regla allow no puede hacer una excepción a un deny. Pon las reglas deny en `.claude/settings.json` para que queden versionadas en el repo:

```json
{
  "permissions": {
    "deny": [
      "Edit(**/*.test.ts)",
      "Edit(**/*.spec.ts)",
      "Edit(tests/**)",
      "Edit(**/__snapshots__/**)"
    ]
  }
}
```

Dos detalles de la documentación de permisos importan aquí. Primero, las reglas `Edit` aplican a todas las herramientas integradas que editan archivos, así que no necesitas una regla `Write(...)` aparte; de hecho, la documentación dice que un patrón `Write(docs/**)` no se aplica: usa `Edit`. Segundo, un patrón deny como `Edit(tests/**)`, sin `/` inicial, coincide con un directorio `tests` a cualquier profundidad dentro del directorio actual.

El límite: estas reglas cubren las herramientas de archivos de Claude y los comandos de Bash que Claude Code puede analizar (redirecciones y comandos como `sed` o `tee`). La documentación es clara en que una regla de Bash no es una frontera de seguridad, porque el mismo efecto se puede lograr con otras invocaciones. Por eso hay una segunda capa.

## Capa 2: un hook PreToolUse que explica el porqué

Una regla deny bloquea. Un hook además puede explicar, y eso importa porque el agente lee el mensaje y cambia de rumbo. Esta es la configuración:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PROJECT_DIR}/.claude/hooks/protect-tests.mjs\""
          }
        ]
      }
    ]
  }
}
```

El `matcher` acepta nombres exactos de herramientas separados por `|`, así que `Edit|Write` coincide con esas dos. Claude Code envía el evento como JSON por stdin y, para estas herramientas, la ruta viene en `tool_input.file_path`. Un script que bloquea rutas de tests:

```js
// .claude/hooks/protect-tests.mjs
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const file = String(input.tool_input?.file_path ?? "").replaceAll("\\", "/");

const isTestPath =
  /\.(test|spec)\.[cm]?[jt]sx?$/.test(file) ||
  /\.snap$/.test(file) ||
  /\/(tests|__snapshots__)\//.test(file);

if (isTestPath) {
  console.error(
    `Blocked: ${file} is part of the test contract. ` +
      "Do not edit tests. Fix the implementation, or stop and tell me why the test is wrong.",
  );
  process.exit(2); // exit code 2 = blocking error; stderr goes back to Claude
}

process.exit(0); // no decision: normal permission flow continues
```

Según la documentación de hooks, el código de salida 2 bloquea la llamada y el stderr del hook es el mensaje que ve Claude. Si prefieres salida estructurada, sal con 0 e imprime un único objeto JSON:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Test files are read-only for the implementing agent."
  }
}
```

El JSON solo se lee con salida 0, y stdout no debe contener nada más. Yo uso la forma con exit 2 porque es más corta. Ojo: `exit 0` aquí significa "sin opinión", no "permitir": el flujo normal de permisos sigue aplicando.

Mantén el hook pequeño. Corre en cada edición, así que debe ser rápido y determinista. Nada de red ni de llamadas a modelos.

## Capa 3: CODEOWNERS más review obligatorio

Las guardas locales dependen de que el agente corra dentro de tu configuración. El repositorio no debería depender de eso. `CODEOWNERS` pone a una persona en cada cambio al contrato. GitHub busca el archivo en `.github/`, en la raíz o en `docs/`:

```text
# .github/CODEOWNERS
# The last matching pattern takes precedence.

*                          @acme/developers
*.test.ts                  @acme/qa
*.spec.ts                  @acme/qa
/tests/                    @acme/qa
**/__snapshots__/          @acme/qa
```

Los dueños necesitan acceso de escritura, y el archivo por sí solo solo solicita reviews automáticamente. Para volver obligatoria la aprobación tienes que activar **Require review from Code Owners** en una regla de branch protection (o usar un ruleset). Sin esa opción, el archivo es solo una sugerencia.

## Capa 4: una guarda en CI que lee el diff

La última capa corre en el PR mismo, así que también atrapa cambios hechos a mano, con otra herramienta o con un comando de Bash que las reglas locales no reconocieron. El workflow corre en `pull_request`, cuyos tipos de actividad por defecto son `opened`, `synchronize` y `reopened`. Agrego `labeled` y `unlabeled` para que una persona pueda reconocer un cambio de contrato intencional:

```yaml
# .github/workflows/test-contract.yml
name: test-contract
on:
  pull_request:
    types: [opened, synchronize, reopened, labeled, unlabeled]

permissions:
  contents: read

jobs:
  guard:
    runs-on: ubuntu-latest
    if: ${{ !contains(github.event.pull_request.labels.*.name, 'contract-change') }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # full history, so the base branch is available to diff

      - name: Inspect the diff
        env:
          BASE_REF: ${{ github.base_ref }}
        run: |
          set -euo pipefail
          range="origin/${BASE_REF}...HEAD"
          tests='(\.(test|spec)\.[cm]?[jt]sx?$|^tests/|__snapshots__/|\.snap$)'

          changed=$(git diff --name-only "$range")
          test_files=$(printf '%s\n' "$changed" | grep -E "$tests" || true)
          src_files=$(printf '%s\n' "$changed" | grep -E '^src/' | grep -Ev "$tests" || true)

          if [ -z "$test_files" ]; then
            echo "No test files changed."
            exit 0
          fi

          if [ -n "$src_files" ]; then
            echo "::error::This PR changes tests and source together. Split it or add the 'contract-change' label."
            exit 1
          fi

          # Added lines that skip or narrow tests
          bad=$(git diff -U0 "$range" -- $test_files \
            | grep -E '^\+[^+]' \
            | grep -cE '\.(only|skip|todo)\(|\b(xit|xdescribe|xtest)\(' || true)
          if [ "$bad" -gt 0 ]; then
            echo "::error::Found $bad added line(s) with .only/.skip/.todo."
            exit 1
          fi

          # Fewer assertions than before
          removed=$(git diff -U0 "$range" -- $test_files | grep -E '^-[^-]' | grep -c 'expect(' || true)
          added=$(git diff -U0 "$range" -- $test_files | grep -E '^\+[^+]' | grep -c 'expect(' || true)
          if [ "$removed" -gt "$added" ]; then
            echo "::error::Assertions dropped: -$removed +$added."
            exit 1
          fi
```

Notas sobre el script:

- `fetch-depth: 0` es necesario porque el checkout por defecto trae un solo commit, y el diff con tres puntos necesita la rama base.
- Es una heurística. Contar `expect(` no detecta un matcher debilitado en la misma línea, y un refactor puede mover aserciones legítimamente. Para eso existe la etiqueta `contract-change`: una persona decide y la decisión queda visible en el PR.
- Vitest ya ayuda. `allowOnly` es `!process.env.CI` por defecto, así que un `.only` hace fallar la corrida en CI, y Vitest no escribe snapshots en CI: un snapshot faltante o distinto falla en lugar de crearse.

Después haz que este check sea requerido en branch protection; si no, es solo una marca roja.

## Snapshots y golden files necesitan a una persona

Los snapshots son la puerta de escape más fácil, porque regenerarlos es un comando documentado (`vitest -u`). Trata el diff de un snapshot como el diff de código: léelo. Si un snapshot cambió y la descripción del PR no puede decir por qué, el cambio no está listo. Los directorios de snapshots y golden files ya están en las reglas deny, en el hook y en CODEOWNERS de arriba, así que un agente no puede refrescarlos en silencio.

## Comentarios de intención: dile al siguiente lector el porqué

La última capa es para el modelo que lee los tests antes de tocar código. Un test con solo un valor exacto invita a "ajustarlo". Uno que declara su intención se resiste:

```ts
import { describe, expect, it } from "vitest";
import { applyDiscount } from "./discount";

describe("applyDiscount", () => {
  it("never produces a negative total", () => {
    // CONTRACT: a discount larger than the order total clamps to 0.
    // Finance relies on this. If this fails, fix applyDiscount, not the test.
    expect(applyDiscount({ total: 50, percent: 120 })).toBe(0);
  });
});
```

Esto no hace cumplir nada. Mejora la probabilidad de que un agente (o una persona cansada) trate la falla como información sobre el código.

## Qué hago cuando un test sí está mal

Los tests tienen bugs. La regla es que el agente que implementa no los arregla. Reporta el test, la falla y por qué cree que el test está mal, y luego una persona o una sesión aparte lo cambia. Ese cambio pasa por el mismo review de PR que el código, y la etiqueta `contract-change` deja constancia de que fue deliberado.

Para comprobar que el contrato es lo bastante fuerte desde el principio, usa mutation testing y tests basados en propiedades. Lo cubro en [Testing adversarial con agentes de IA](/es/blog/adversarial-testing-with-ai-agents/).

## Puntos clave

- A veces los agentes hacen pasar los tests por el camino barato: aserciones más débiles, `.skip`, snapshots regenerados, fixtures editados. Asume que va a pasar.
- Separa quién escribe los tests de quién implementa, y haz los tests de solo lectura para el agente que implementa.
- Usa `permissions.deny` con patrones `Edit(...)`, un hook `PreToolUse` con matcher `Edit|Write` que salga con código 2 y un mensaje claro, y recuerda que Bash no es una frontera dura.
- `CODEOWNERS` solo obliga algo cuando "Require review from Code Owners" está activo en branch protection o en un ruleset.
- Una guarda de CI sobre el diff del PR es la capa que no depende de la configuración del agente. Hazla requerida y da a las personas una forma visible de aprobar cambios intencionales.
- Los snapshots son tests: revisa sus diffs y nunca dejes que se regeneren en silencio.

## Lecturas recomendadas

- [Hooks reference (Claude Code)](https://code.claude.com/docs/en/hooks)
- [Configure permissions (Claude Code)](https://code.claude.com/docs/en/permissions)
- [About code owners (GitHub Docs)](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Events that trigger workflows: pull_request (GitHub Docs)](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows)
- [Snapshot testing (Vitest)](https://vitest.dev/guide/snapshot)
- [allowOnly (Vitest)](https://vitest.dev/config/allowonly)
