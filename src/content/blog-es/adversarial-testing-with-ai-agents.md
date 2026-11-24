---
title: "Testing adversarial con IA: uno construye, otro rompe"
description: "Un agente de IA construye y otro rompe: un breaker que solo ve la spec, propiedades con fast-check y el mutation score de Stryker en vez de la cobertura."
date: 2027-02-15
category: "Testing"
cover: "adversarial"
draft: false
---

# Testing adversarial con agentes de IA: uno construye, otro rompe

**TL;DR:** Un agente que escribe el código y luego sus tests comparte los mismos puntos ciegos, así que los tests pasan por las mismas razones por las que el código funciona. Dale el trabajo de romper a otro agente que solo vea la spec y la interfaz pública, haz que exprese los ataques como propiedades con fast-check en lugar de ejemplos elegidos a mano, y mide si tus tests detectan fallos con el mutation score de Stryker, no con la cobertura. Una persona decide qué ataques se vuelven tests permanentes.

## Por qué el constructor no puede probar su propio trabajo

Cuando el mismo agente implementa una función y escribe sus tests, los tests reflejan la implementación. Si olvidó que un descuento puede superar el total del pedido, también olvidó probarlo. La cobertura de líneas dice 100% y nada se verificó.

Las personas tenemos el mismo problema, y por eso existe QA. Con agentes el arreglo es barato: abre una segunda sesión con otro trabajo y otra visión del mundo. Esto va de la mano con la otra mitad de la historia, mantener los tests resultantes a salvo del constructor, que cubrí en [Los tests como contrato](/es/blog/tests-as-a-contract-ai/).

## El rol del breaker

El breaker tiene un solo objetivo: encontrar una entrada donde la implementación viole la spec. Lo que lo hace útil es lo que **no** ve.

- Recibe la spec escrita y los tipos exportados o las firmas de las funciones.
- No recibe el código de la implementación. Si lee el código, empieza a razonar sobre cómo funciona y deja de razonar sobre lo que debería hacer.
- Puede ejecutar el código y escribir archivos de test nuevos, en su propio worktree o rama. No puede cambiar la implementación.

Un prompt que funciona:

```text
You are a breaker. You did not write this code and you cannot read it.

Spec: <paste the spec>
Public interface: <paste the signatures and types>

Find inputs where the behavior violates the spec. Prioritize:
1. Boundary values (0, 1, max, empty, just past each limit)
2. Hostile input (negative numbers, NaN, huge strings, duplicates, unicode)
3. Invariants that must hold for ALL valid inputs

Write each finding as a Vitest test or a fast-check property.
For every test, say which spec line it attacks. Do not edit src/.
```

La última instrucción importa: atar cada ataque a una línea de la spec me deja filtrar rápido. Un test que ataca algo que la spec nunca prometió es ruido, o un hueco en la spec.

## Propiedades en lugar de ejemplos

Pedirle a un agente 20 casos límite te da 20 ejemplos que a él se le ocurrieron. Una propiedad dice "para cualquier entrada válida, esto siempre se cumple", y la librería genera las entradas, incluidas algunas que nadie escribiría a mano. Con fast-check, un arbitrary genera valores de forma sembrada (seeded) y reduce (shrink) uno que falla hasta un contraejemplo pequeño.

Aquí hay una función y las propiedades que escribiría un breaker a partir de la spec "el total con descuento nunca es negativo y nunca es mayor que el original":

```ts
// src/orders/discount.ts
export function applyDiscount(total: number, percent: number): number {
  return Math.round(total * (1 - percent / 100) * 100) / 100;
}
```

```ts
// tests/orders/discount.property.test.ts
import { describe, it } from "vitest";
import fc from "fast-check";
import { applyDiscount } from "../../src/orders/discount";

describe("applyDiscount properties", () => {
  it("never returns a negative total", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 200 }),
        (total, percent) => applyDiscount(total, percent) >= 0,
      ),
    );
  });

  it("never returns more than the original total", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 100 }),
        (total, percent) => applyDiscount(total, percent) <= total,
      ),
    );
  });
});
```

La primera propiedad falla de inmediato: con `percent` mayor a 100 el resultado se vuelve negativo. fast-check reduce la falla a un caso mínimo e imprime un contraejemplo junto con un seed. Los parámetros de `fc.assert` incluyen `numRuns` (100 por defecto), y `seed` junto con `path` para reproducir una corrida que falló, que es como conviertes un hallazgo que parece intermitente en un test reproducible:

```ts
fc.assert(property, { seed: 1234567890, path: "42:3", numRuns: 500 });
```

Usa el seed y el path que imprime tu propio mensaje de falla, no estos valores. Cuando el bug ya se entendió y se arregló, conservo la propiedad y agrego el contraejemplo reducido como un test de ejemplo normal, para que la regresión quede fijada aunque cambie la generación.

Para código asíncrono, el equivalente es `fc.asyncProperty`.

## Medir los tests: mutation score, no cobertura

Una vez que los tests del breaker están dentro, ¿cómo sabes si la suite es fuerte? No con la cobertura, que te dice que una línea se ejecutó, no que algo la verificó. El mutation testing cambia tu código en pequeño (un `<` se vuelve `<=`, un `+` se vuelve `-`) y vuelve a correr los tests. Si siguen pasando, el mutante **sobrevivió** y tus tests no detectaron un comportamiento.

Stryker define el mutation score como los mutantes detectados entre los mutantes válidos, donde detectado significa eliminado (killed) o con timeout. Los mutantes que sobreviven y los que no tienen cobertura cuentan en tu contra.

Instala StrykerJS con el runner de Vitest, y Vitest si aún no lo tienes:

```bash
npm i --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner
```

`stryker.config.json`:

```json
{
  "testRunner": "vitest",
  "vitest": {
    "configFile": "vitest.config.ts"
  },
  "mutate": ["src/orders/**/*.ts", "!src/**/*.test.ts"],
  "reporters": ["clear-text", "progress", "html"],
  "thresholds": { "high": 80, "low": 60, "break": 70 }
}
```

Algunos datos que conviene conocer, de la documentación de Stryker:

- `thresholds` es todo o nada: no puedes dar solo un valor. `break` es `null` por defecto, y cuando el score cae por debajo Stryker sale con código 1, así que el CI falla.
- `mutate` acepta `!` para excluir globs. Los plugins `@stryker-mutator/*` se cargan automáticamente.
- El runner de Vitest corre por defecto solo los tests relacionados con los archivos mutados (`vitest.related: true`). Desactívalo si tus tests no importan el código fuente directamente. Browser Mode no está soportado, y Stryker sobrescribe algunos ajustes de Vitest como `maxWorkers`, `watch` y la cobertura.
- `incremental: true` guarda los resultados y los reutiliza en la siguiente corrida, lo que ayuda mucho en código grande.

Córrelo:

```bash
npx stryker run
```

El reporte lista los sobrevivientes, y los sobrevivientes son el segundo trabajo del breaker. Uno típico:

```text
[Survived] ArithmeticOperator
src/orders/discount.ts:2:14
-   return Math.round(total * (1 - percent / 100) * 100) / 100;
+   return Math.round(total * (1 + percent / 100) * 100) / 100;
```

Si ese sobrevive, ningún test comprueba que un descuento de verdad baje el precio. La segunda propiedad de arriba debió detectarlo; si no lo hizo, la propiedad era más débil de lo que pensaba. Le devuelvo cada sobreviviente al breaker: "este mutante sobrevivió, escribe el test más pequeño que lo elimine". Luego reviso el test, porque un agente también puede escribir un test que elimina un mutante por la razón equivocada.

No persigo el 100%. Algunos mutantes son equivalentes (el comportamiento no cambia) y cierto código no vale ese costo. Un score que sube en los módulos donde los bugs salen caros es la señal útil.

## El bucle

1. Una persona escribe la spec y el constructor implementa.
2. El breaker, en una sesión aparte con solo la spec y la interfaz, propone ataques como tests y propiedades.
3. **Una persona filtra.** Cada test debe corresponder a una línea de la spec. Descarta los que atacan algo que la spec nunca prometió, o corrige la spec.
4. Los tests aceptados entran al contrato, protegidos del constructor como en [Los tests como contrato](/es/blog/tests-as-a-contract-ai/).
5. Corre Stryker. Los sobrevivientes vuelven al breaker para tests dirigidos, que vuelven a pasar por el paso 3.
6. El constructor arregla el código hasta que todo esté en verde, sin tocar los tests.

El paso 3 es el que no se delega. El breaker es seguro de sí mismo y a veces se equivoca, y un test equivocado que entra al contrato empujará al constructor hacia código equivocado.

## Límites y costo

- Cuesta tokens y tiempo. Stryker multiplica el tiempo de tus tests por aproximadamente el número de mutantes, así que córrelo en los módulos que importan y usa `incremental` y los globs de `mutate`. En CI lo corro sobre los archivos que cambiaron, no sobre todo.
- El breaker es tan bueno como la spec. Una spec vaga produce ataques vagos, lo cual es una señal útil sobre la spec.
- Las propiedades son más difíciles de escribir que los ejemplos. Empieza con unos pocos invariantes (nunca negativo, idempotente, ida y vuelta, una salida ordenada sigue ordenada) antes de algo más elaborado.
- Dos agentes también pueden compartir puntos ciegos, sobre todo si son el mismo modelo. Un modelo o un prompt distinto para el breaker ayuda, pero no reemplaza tu propio review.

## Puntos clave

- Separa los roles: el constructor implementa, el breaker ataca con solo la spec y la interfaz pública.
- Pídele al breaker propiedades con `fc.assert` y `fc.property`, no solo ejemplos. Guarda el seed y el path de una falla para reproducirla.
- Juzga tu suite por el mutation score de Stryker, no por la cobertura. Define `thresholds.break` para que el CI falle por debajo de tu mínimo.
- Devuelve los mutantes sobrevivientes como peticiones de tests dirigidos, y revisa esos tests.
- Una persona decide qué entra al contrato. El agente propone, tú aceptas.

## Lecturas recomendadas

- [fast-check: Getting started](https://fast-check.dev/docs/introduction/getting-started/)
- [fast-check: Parameters interface](https://fast-check.dev/docs/api/interfaces/Parameters/)
- [StrykerJS: Vitest runner](https://stryker-mutator.io/docs/stryker-js/vitest-runner/)
- [StrykerJS: Configuration](https://stryker-mutator.io/docs/stryker-js/configuration/)
- [Stryker: Mutant states and metrics](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/)
