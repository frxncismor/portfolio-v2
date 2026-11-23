---
title: "Angular 21 sin Zone.js: qué cambia y cómo migrar"
description: "Zoneless es el default en Angular 21. Qué dispara la detección de cambios, cómo quitar zone.js, qué se rompe y cómo se comportan SSR y las pruebas."
date: 2027-01-11
category: "Angular"
draft: false
---

# Angular 21 sin Zone.js: qué cambia y cómo migrar

**TL;DR:** En Angular 21 la detección de cambios zoneless es el default, según la documentación oficial. Angular ya no parchea todas las APIs asíncronas para saber cuándo renderizar. Vuelve a renderizar cuando cambia un signal que lee un template, cuando se dispara un evento del template, cuando se llama `markForCheck` (el pipe `async` lo hace por ti) o cuando llamas `ComponentRef.setInput`. Migrar una app existente significa quitar `zone.js` del build, arreglar los lugares donde mutabas campos normales desde timers o callbacks, y registrar el trabajo asíncrono durante SSR con `PendingTasks`. Abajo está el orden que sigo y lo que muerde.

Este post se apoya en otros dos: [Angular Signals: Introducción Práctica](/es/blog/angular-signals/) para el modelo mental, y [Angular Signals más allá de lo básico](/es/blog/angular-signals-linkedsignal-resource/) para `linkedSignal` y `resource`. Si además leíste [Inmutabilidad en TypeScript](/es/blog/typescript-immutability-readonly-as-const/), aquí aplica la misma disciplina: sin zonas, el cambio tiene que verse como un valor nuevo, no escondido en una mutación.

## Qué Hacía Zone.js y Por Qué Se Va

Zone.js parchea APIs del navegador (`setTimeout`, promesas, event listeners, XHR) para que Angular se entere cuando termina cualquier tarea asíncrona. Después de cada una, Angular ejecuta la detección de cambios sobre el árbol. Funciona sin que pienses en ello, y por eso duró tanto. El costo es que Angular revisa más veces de las necesarias, el código asíncrono corre a través de APIs parchadas (lo que también se nota en los stack traces) y cada app carga una librería extra.

Los signals invierten el modelo. Angular sabe qué templates leen qué signals, así que puede programar un render cuando cambia un signal, no cuando pasa cualquier cosa en cualquier lugar. Zoneless es el final de ese camino.

## Estabilidad: Qué Es Default y Qué No

Revisé la documentación de las piezas que toca este post:

- `provideZonelessChangeDetection` es estable desde v20.2 (referencia de la API).
- La guía de zoneless dice que desde v21 zoneless es el default, así que no hace falta configurar nada. Te indica asegurarte de que `provideZoneChangeDetection` no se use en ningún lado para sobrescribirlo.
- `provideCheckNoChangesConfig`, la ayuda de depuración que menciono más adelante, está en developer preview.
- Signal Forms salió como experimental en v21, así que no construyo sobre ellos aquí.

Si estás en v20, lo activas explícitamente:

```ts
import { bootstrapApplication } from '@angular/platform-browser'
import { provideZonelessChangeDetection } from '@angular/core'

bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection()],
})
```

## Qué Dispara la Detección de Cambios Ahora

Según la documentación, un render se programa con:

- `ChangeDetectorRef.markForCheck`, que `AsyncPipe` llama automáticamente
- `ComponentRef.setInput`
- actualizar un signal que lee un template
- el callback de un listener de host o de template
- adjuntar una vista que fue marcada como sucia por alguno de los anteriores

Fíjate en lo que no está en la lista: un `setTimeout`, una promesa resuelta, el callback de un `fetch`. Antes disparaban un render porque zone.js avisaba que habían corrido. Ahora solo importan si terminan en uno de los cinco puntos de arriba.

```ts
// Before: worked because zone.js noticed the timeout
export class StatusComponent {
  status = 'saving'

  constructor() {
    setTimeout(() => (this.status = 'saved'), 1000) // zoneless: template stays on "saving"
  }
}

// After: the template reads a signal
export class StatusComponent {
  readonly status = signal('saving')

  constructor() {
    setTimeout(() => this.status.set('saved'), 1000)
  }
}
```

Esa es toda la migración para la mayoría de los componentes: el estado que lee un template pasa a un signal. Por eso hice primero el trabajo con signals.

## Migrar una App Existente

Mi orden, que sigue la documentación:

1. **Haz los componentes amigables con signals.** Mueve el estado que lee el template a signals. Agrega `ChangeDetectionStrategy.OnPush` a los componentes conforme los toques. La documentación dice que OnPush se recomienda pero no es obligatorio para zoneless; te mantiene honesto porque falla de forma visible cuando mutas el estado en su lugar.
2. **Haz zoneless explícito mientras pruebas.** En v20, agrega `provideZonelessChangeDetection()`. En v21 es el default, pero si la app todavía tiene `provideZoneChangeDetection()` en algún lado, quítalo para la prueba.
3. **Quita zone.js.** Borra `zone.js` y `zone.js/testing` de la opción `polyfills` de los targets `build` y `test` en `angular.json`. Si tienes un `polyfills.ts`, quita los imports de `zone.js`. Luego `npm uninstall zone.js`.
4. **Reemplaza los hooks de estabilidad.** `NgZone.onMicrotaskEmpty`, `onUnstable` y `onStable` nunca emiten en apps zoneless, y `NgZone.isStable` siempre es `true`. Usa `afterNextRender` para un solo render o `afterEveryRender` para trabajo repetido. Para estado del DOM, usa un `MutationObserver`. La documentación dice que puedes dejar `NgZone.run` y `runOutsideAngular`, porque quitarlos puede afectar a librerías usadas en apps que todavía corren zone.js.
5. **Activa la verificación de depuración mientras migras** (developer preview):

```ts
import { provideCheckNoChangesConfig } from '@angular/core'

providers: [
  provideCheckNoChangesConfig({ exhaustive: true, interval: 1000 }),
]
```

Revisa periódicamente si hay bindings que cambiaron sin notificación y lanza `ExpressionChangedAfterItHasBeenCheckedError` cuando encuentra uno. Así encuentras el campo normal que alguien mutó desde un callback. Déjalo solo en builds de desarrollo.

## Qué Se Rompe

**Mutar campos normales desde código asíncrono.** El ejemplo de arriba. Busca bloques con `setTimeout`, `setInterval`, `.then(` y `subscribe(` que asignen a un `this.algo` usado en un template.

**Formularios reactivos.** La documentación advierte que `setValue`, `patchValue` y `FormArray.push` no programan detección de cambios. Conecta los observables del formulario a `markForCheck()` o expón los datos con signals (`toSignal(form.valueChanges)`).

**Librerías de terceros.** Las que actualizan su propio estado y esperan que zone.js renderice dejarán de actualizarse. Revisa en cada una si soporta zoneless; si no, llama `markForCheck()` desde el callback o envuelve el valor en un signal. Los componentes de librería que alojan componentes del usuario con `ViewContainerRef.createComponent` no pueden usar `OnPush`; la documentación sugiere que usen la estrategia `Eager` y notifiquen a Angular de los cambios.

**Pruebas.** `TestBed` es zoneless por default, incluso si `zone.js` se carga por `polyfills`. Agrega `provideZoneChangeDetection()` a los providers de prueba si una suite de verdad necesita zonas. La documentación recomienda `await fixture.whenStable()` en lugar de `fixture.detectChanges()`; las suites existentes pueden conservar `detectChanges()`.

```ts
it('shows the saved status', async () => {
  const fixture = TestBed.createComponent(StatusComponent)
  await fixture.whenStable()
  expect(fixture.nativeElement.textContent).toContain('saving')
})
```

`fakeAsync` no aparece en la guía de zoneless. Viene de `zone.js/testing`, así que cuando quitas zone.js del target `test`, espera tener que reemplazarlo. Yo uso los fake timers del test runner en lugar de `fakeAsync`.

## SSR e Hidratación sin Zonas

Durante el render en el servidor, Angular usaba zone.js para saber cuándo la app estaba "estable" y podía serializarse. Sin zonas, le avisas del trabajo que debe terminar antes de serializar con `PendingTasks`:

```ts
import { inject, PendingTasks } from '@angular/core'

const tasks = inject(PendingTasks)

tasks.run(async () => {
  const result = await loadRecommendations()
  this.recommendations.set(result)
})
```

Para trabajo que no es una sola promesa, `tasks.add()` devuelve una función de limpieza que llamas en un `finally`. Con RxJS, el operador `pendingUntilEvent()` de `rxjs-interop` mantiene la app inestable hasta que el observable emite, completa, falla o se cancela la suscripción. Si renderizas en el servidor, como en mi [monorepo con SSR](/es/blog/angular-21-ssr-fastify-drizzle-monorepo/), revisa cualquier `setTimeout` escrito a mano o promesa suelta que asigne estado durante el render: esas son las que Angular ya no espera por sí solo.

## Checklist de Migración

- El estado que lee el template vive en signals (o llega al template vía `async` o `toSignal`)
- Los componentes usan `OnPush` donde se puede
- `provideZoneChangeDetection` ya no está, o se conserva a propósito en un área legacy
- `zone.js` y `zone.js/testing` están fuera de `angular.json`, `polyfills.ts` y `package.json`
- Nada depende de `NgZone.onStable`, `onMicrotaskEmpty` o `isStable`
- Las actualizaciones de formularios reactivos llegan al template con `markForCheck` o signals
- El trabajo asíncrono durante SSR se registra con `PendingTasks`
- Las pruebas usan `await fixture.whenStable()` y no `fakeAsync`
- Las librerías de terceros se revisaron para soporte zoneless
- `provideCheckNoChangesConfig` corrió limpio en desarrollo

## Puntos Clave

- Zoneless es el default en Angular 21; `provideZonelessChangeDetection` es estable desde v20.2.
- La detección de cambios corre con actualizaciones de signals, eventos del template, `markForCheck`, `setInput` y adjuntar vistas sucias, no con timers ni promesas.
- El trabajo principal de la migración es mover a signals el estado que lee el template.
- Los eventos de estabilidad de `NgZone` no se disparan; usa `afterNextRender` y `afterEveryRender`.
- Registra el trabajo asíncrono durante SSR con `PendingTasks`.
- Usa `provideCheckNoChangesConfig` (developer preview) en desarrollo para encontrar mutaciones silenciosas.

## Lecturas Recomendadas

- [Angular without ZoneJS (Zoneless)](https://angular.dev/guide/zoneless)
- [API: provideZonelessChangeDetection](https://angular.dev/api/core/provideZonelessChangeDetection)
- [Async reactivity with resources](https://angular.dev/guide/signals/resource)
- [RxJS interop](https://angular.dev/ecosystem/rxjs-interop)
