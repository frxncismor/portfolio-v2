---
title: "Migrar las Pruebas Unitarias de Angular a Vitest"
description: "Guía paso a paso para pasar un proyecto Angular de Karma y Jasmine a Vitest: builder, schematic, spies, TestBed, cobertura y CI."
date: 2027-02-08
category: "Angular"
draft: false
---

# Migrar las Pruebas Unitarias de Angular de Karma a Vitest

**TL;DR:** El builder de pruebas unitarias de Angular (`@angular/build:unit-test`) corre tus specs con Vitest, y los proyectos nuevos del CLI ya lo usan por defecto. Karma todavía funciona, pero es el camino viejo. Mover un proyecto existente toma seis pasos: instalar Vitest y un DOM, cambiar el builder, quitar Karma, correr el schematic oficial, arreglar lo que no pudo convertir y configurar cobertura y CI. Primero una advertencia honesta: la documentación de Angular todavía llama **experimental** a la migración de proyectos existentes, y también al schematic, así que trata su resultado como un borrador que hay que revisar, no como un refactor terminado.

Esta guía sigue el mismo formato por pasos que mi [guía de ESLint y Prettier para Angular 20](/es/blog/how-to-setup-eslint-and-prettier-in-angular-20-projects/). Los ejemplos usan una app inventada de `orders`.

## Por Qué Dejar Karma

- **Necesita un navegador real para todo.** Lanzar Chrome para probar lógica pura es un costo que pagas en cada corrida, en CI y en local.
- **Watch mode y velocidad de feedback.** Vitest vuelve a correr solo lo que cambió y arranca rápido; esa es la diferencia entre correr las pruebas todo el tiempo y correrlas justo antes del push.
- **Un solo lenguaje de pruebas en todo el stack.** Ya uso Vitest en servicios de Node, así que `vi.fn`, `describe` y `expect` son iguales en todos lados.
- **Karma va de salida.** La documentación de Angular trata a Vitest como la opción por defecto y a Karma como "todavía soportado", que es una forma amable de decir que conviene planear la migración.

Las pruebas corren en jsdom por defecto, y el builder también puede ejecutarlas en un navegador real cuando lo necesites (más en el Paso 6).

## Paso 1: Instalar Dependencias

```bash
npm install --save-dev vitest jsdom
```

El CLI detecta `happy-dom` si está instalado y, si no, usa `jsdom`. La migración además requiere el sistema de build `application`, que es el que usan los proyectos nuevos de Angular. Si todavía tienes el builder `browser` legacy para tu app, migra eso primero.

## Paso 2: Cambiar el Builder en `angular.json`

Cambia el builder del target `test`:

```json
"test": {
  "builder": "@angular/build:unit-test"
}
```

Los valores por defecto son `"tsConfig": "tsconfig.spec.json"` y `"buildTarget": "::development"`. Lo segundo importa: el builder ya no acepta `polyfills`, `assets` ni `styles` en el target de pruebas. Si tus tests necesitan algo distinto a tu build de desarrollo, ponlo en una configuración de build dedicada.

Opciones útiles que puedes agregar en `options`:

```json
"options": {
  "include": ["src/**/*.spec.ts"],
  "setupFiles": ["src/test-setup.ts"],
  "providersFile": "src/test-providers.ts",
  "coverage": false
}
```

`providersFile` es muy cómodo: exporta providers por defecto que se aplican a todos los tests, y reemplaza mucho `TestBed.configureTestingModule` repetido.

## Paso 3: Quitar Karma

```bash
npm uninstall karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter jasmine-core
```

Borra `karma.conf.js` y `src/test.ts`. Nada de lo personalizado en tu configuración de Karma se migra automáticamente:

- Los reporters pasan a ser reporters de Vitest.
- Los plugins de Karma necesitan un equivalente en Vitest; la cobertura ya viene incluida.
- Los launchers de navegador personalizados pasan a ser la opción `browsers` más un proveedor de navegador.

Si además necesitas una configuración propia de Vitest, genera un archivo base y apunta el builder a él:

```bash
ng generate config vitest
```

Esto crea `vitest-base.config.mts`. Referéncialo con `"runnerConfig": "vitest-base.config.mts"` (o pon `runnerConfig` en `true` y el builder busca un archivo `vitest-base.config.*`). El CLI de Angular sobrescribe `test.projects` y `test.include`, así que no cuentes con ellos en tu archivo.

## Paso 4: Correr el Schematic

```bash
ng g @schematics/angular:refactor-jasmine-vitest
```

Reescribe la sintaxis de Jasmine a sintaxis de Vitest en tus specs. Opciones que probablemente uses:

| Opción | Qué hace |
|---|---|
| `--project <name>` | Apunta a un proyecto del workspace |
| `--include <path>` | Refactoriza un archivo o carpeta (empieza por aquí) |
| `--add-imports` | Agrega imports explícitos de `vitest` si los globals están desactivados |
| `--verbose` | Registra cada transformación |

No instala paquetes, no edita `angular.json` ni borra archivos de Karma, por eso los Pasos 1 a 3 van antes. Mi consejo: córrelo en una carpeta con `--include`, lee el diff y luego córrelo en el resto.

## Paso 5: Arreglar Lo que el Schematic No Pudo Convertir

El mapeo es casi mecánico:

| Jasmine | Vitest |
|---|---|
| `spyOn` | `vi.spyOn` |
| `jasmine.createSpy` | `vi.fn` |
| `jasmine.any` | `expect.any` |
| `jasmine.objectContaining` | `expect.objectContaining` |
| `fit` / `fdescribe` | `it.only` / `describe.only` |
| `xit` / `xdescribe` | `it.skip` / `describe.skip` |
| `fail()` | `expect.fail()` |

Los spies complejos o anidados reciben comentarios TODO en lugar de una conversión. Búscalos a mano.

Los spies se comportan distinto a Jasmine en algo importante: un `spyOn` de Jasmine reemplaza el método por defecto, mientras que `vi.spyOn` de Vitest **llama a la implementación original** a menos que le des una. Declara tu intención:

```ts
// before (Jasmine)
const repo = jasmine.createSpyObj<OrdersRepository>('OrdersRepository', ['findAll']);
repo.findAll.and.returnValue(Promise.resolve([]));

// after (Vitest)
const repo = { findAll: vi.fn().mockResolvedValue([]) };
```

```ts
const spy = vi.spyOn(orderService, 'total').mockReturnValue(100);
// remember to restore real implementations between tests
afterEach(() => vi.restoreAllMocks());
```

Los timers y `fakeAsync` requieren una decisión. La documentación ofrece dos caminos: conservar `fakeAsync`, `flush` y `waitForAsync` agregando `zone.js/plugins/vitest-patch` a los `polyfills` del target de pruebas, o (mi preferencia) reescribirlos como código `async` nativo con fake timers de Vitest:

```ts
it('debounces the search', async () => {
  vi.useFakeTimers();
  component.query.set('acme');

  await vi.advanceTimersByTimeAsync(300);

  expect(searchSpy).toHaveBeenCalledTimes(1);
  vi.useRealTimers();
});
```

Un test escrito así sigue funcionando el día que quites Zone.js.

Un spec de `TestBed` para un componente standalone con signals no necesita nada especial. Es el mismo código que escribirías con Jasmine, solo que con `vi` para el mock:

```ts
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi } from 'vitest';
import { OrderList } from './order-list';
import { OrdersRepository } from './orders.repository';

describe('OrderList', () => {
  it('shows the orders returned by the repository', async () => {
    const repo = { findAll: vi.fn().mockResolvedValue([{ id: '1', customer: 'Acme' }]) };
    TestBed.configureTestingModule({
      imports: [OrderList],
      providers: [{ provide: OrdersRepository, useValue: repo }],
    });

    const fixture = TestBed.createComponent(OrderList);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Acme');
    expect(repo.findAll).toHaveBeenCalledOnce();
  });
});
```

El import explícito de `vitest` solo hace falta si desactivaste los globals (o usaste `--add-imports`).

## Paso 6: Cobertura, Scripts y CI

La cobertura es un flag del builder:

```bash
ng test --coverage
```

El reporte queda en `coverage/`. El proveedor por defecto de Vitest es v8; si la corrida pide un paquete de cobertura, instálalo con `npm i -D @vitest/coverage-v8`. Para los umbrales usa la opción `coverage.thresholds` de Vitest en tu config del runner:

```ts
// vitest-base.config.mts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
```

No verifiqué de punta a punta que todas las opciones de cobertura pasen por el builder de Angular en todas las versiones, así que rompe un umbral a propósito una vez y confirma que la corrida falla.

Scripts en `package.json`:

```json
{
  "scripts": {
    "test": "ng test",
    "test:ci": "ng test --no-watch --no-progress --coverage"
  }
}
```

`ng test` queda en watch por defecto en una terminal interactiva. En servidores de CI que definen `CI=true` la corrida es única y headless; si el tuyo no lo hace, `--no-watch --no-progress` lo deja explícito. Un paso de GitHub Actions es simplemente `npm run test:ci`.

Si quieres pruebas en un navegador real, instala un proveedor como `@vitest/browser-playwright` y pon `"browsers": ["chromium"]` en las opciones (usa `chromiumHeadless` desde la línea de comandos para corridas headless).

## Qué No Migrar a Mano

Las reescrituras mecánicas son donde la IA ahorra tiempo, con una regla: trabaja sobre un **diff que revisas**, nunca sobre un montón de cambios que mezclas a ciegas. Un buen reparto:

- Deja que el schematic haga la conversión de sintaxis.
- Pídele a un asistente propuestas para los TODO que deja (spies anidados, `createSpyObj`, callbacks `done`), una carpeta a la vez, y lee cada diff.
- Las decisiones de criterio son tuyas: qué hacer con `fakeAsync`, qué tests probaban el framework en lugar de tu código, cuáles borrar.

Corre la suite antes y después: la cantidad de tests que pasan no debería reducirse en silencio.

## Puntos Clave

- `@angular/build:unit-test` corre Vitest; los proyectos nuevos de Angular ya lo usan y Karma es el camino legacy.
- La migración de proyectos existentes está documentada como experimental: revisa el resultado del schematic, no confíes a ciegas.
- El orden es: instalar, cambiar builder, quitar Karma, correr `refactor-jasmine-vitest`, arreglar lo que sobre, configurar cobertura y CI.
- `vi.spyOn` llama a la implementación original por defecto; `jasmine.createSpyObj` pasa a ser un objeto simple con `vi.fn()`.
- Prefiere `async` nativo con `vi.useFakeTimers()` sobre `fakeAsync`; el polyfill `vitest-patch` de Zone.js es el puente si lo necesitas.
- La cobertura es `ng test --coverage`; los umbrales viven en la config del runner de Vitest.

## Lecturas Recomendadas

- [Angular: Migrating from Karma and Jasmine to Vitest](https://angular.dev/guide/testing/migrating-to-vitest)
- [Angular: Testing](https://angular.dev/guide/testing)
- [Vitest: vi API](https://vitest.dev/api/vi.html)
- [Vitest: Coverage guide](https://vitest.dev/guide/coverage.html)
- [Vitest: Coverage configuration](https://vitest.dev/config/coverage)
