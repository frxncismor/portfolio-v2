---
title: "Angular Signals más allá de lo básico: linkedSignal"
description: "Signal inputs, model(), linkedSignal, resource y httpResource en Angular 21: para qué sirve cada uno, qué es estable y dónde RxJS sigue ganando."
date: 2026-11-30
category: "Angular"
cover: "signals"
draft: false
---

# Angular Signals más allá de lo básico: linkedSignal y resource

**TL;DR:** `signal`, `computed` y `effect` cubren la mitad fácil de la reactividad. La otra mitad es el estado que debe reiniciarse cuando cambia otra cosa (`linkedSignal`) y los datos asíncronos que quieres tratar como signals (`resource` y `httpResource`). Además uso `input()`, `output()` y `model()` basados en signals en todos lados. Aquí explico cómo funciona cada pieza, cuáles son estables en Angular 21 y cuáles no, y dónde sigo usando RxJS.

En [Angular Signals: Introducción Práctica](/es/blog/angular-signals/) vimos lo básico. Ese post es corto a propósito. Este es el seguimiento que me hubiera gustado tener cuando empecé a usar signals en componentes reales: formularios con selects dependientes, listas que cargan de una API, bindings entre padre e hijo.

## Qué Es Estable y Qué No

Antes del código, el estado de cada API. Lo revisé en la referencia de angular.dev para no adivinar:

| API | Estado |
|---|---|
| `effect` | estable desde v20.0 |
| `linkedSignal` | estable desde v20.0 |
| `model()` | estable desde v19.0 |
| `resource()` | experimental en la documentación de v21; la documentación actual lo marca estable desde v22.0 |
| `httpResource` | la página que revisé dice estable desde v22.0, así que en v21 trátalo como experimental |
| Signal Forms | salió como experimental en v21 |

Entonces, en Angular 21 `resource` y `httpResource` funcionan, pero su API todavía puede cambiar entre versiones menores. Los uso en proyectos personales y los dejo detrás de un wrapper pequeño en lo que no quiero refactorizar después. `linkedSignal` y `effect` son seguros.

## Repaso Rápido y Cuándo No Usar effect

Tienes `signal` para estado escribible, `computed` para estado derivado y `effect` para efectos secundarios. Mi regla: un `effect` debe hablar con algo fuera del grafo de signals, como `localStorage`, una librería de gráficas o el DOM. Si un effect lee un signal y escribe otro, casi siempre querías un `computed` o un `linkedSignal`.

```ts
// Smell: derived state built with an effect
effect(() => {
  this.total.set(this.items().reduce((sum, i) => sum + i.price, 0))
})

// Better
readonly total = computed(() => this.items().reduce((sum, i) => sum + i.price, 0))
```

## Signal Inputs, output() y model()

`@Input` y `@Output` siguen funcionando. La documentación dice que las funciones basadas en signals se recomiendan para proyectos nuevos, y estoy de acuerdo: los inputs pasan a ser signals que puedes usar en `computed`, y un input requerido se valida en tiempo de compilación.

```ts
import { Component, input, output, model, computed } from '@angular/core'

@Component({
  selector: 'app-quantity-picker',
  template: `
    <button (click)="step(-1)">-</button>
    <span>{{ quantity() }} / {{ max() }}</span>
    <button (click)="step(1)" [disabled]="atMax()">+</button>
    <button (click)="added.emit(quantity())">Add to cart</button>
  `,
})
export class QuantityPickerComponent {
  readonly productId = input.required<string>()
  readonly max = input(10)
  readonly quantity = model(1) // two-way: [(quantity)]="..." in the parent
  readonly added = output<number>()

  readonly atMax = computed(() => this.quantity() >= this.max())

  step(delta: number) {
    this.quantity.update(q => Math.min(this.max(), Math.max(1, q + delta)))
  }
}
```

Unos detalles de la documentación que vale la pena recordar: `input.required` no agrega `undefined` al tipo, `input()` acepta un `transform` (`booleanAttribute` y `numberAttribute` vienen incluidos) y `model()` crea automáticamente un output `quantityChange`, que es lo que hace funcionar `[(quantity)]`. Los model inputs no soportan transforms.

En el padre, `[(quantity)]="selectedQty"` recibe el signal en sí, no su valor.

## linkedSignal: Estado Derivado que Puedes Sobrescribir

Este es el que me faltaba desde hace años. Imagina un selector de envío. La lista de opciones depende del país de destino y el usuario elige una. Cuando cambia el país cambia la lista, y la selección debe reiniciarse. Un `computed` no se puede escribir y un `signal` normal no se reinicia. Un `effect` que lo reinicie funciona, pero es el smell de arriba.

`linkedSignal` es un signal escribible cuyo valor se recalcula cada vez que cambia su fuente:

```ts
import { linkedSignal } from '@angular/core'

readonly shippingOptions = computed(() => optionsFor(this.country()))

// Shorthand: resets to the first option whenever the options change
readonly selected = linkedSignal(() => this.shippingOptions()[0])

choose(option: ShippingOption) {
  this.selected.set(option) // user override
}
```

La forma larga te da acceso al valor anterior, lo que permite conservar la selección si sigue siendo válida:

```ts
readonly selected = linkedSignal<ShippingOption[], ShippingOption>({
  source: this.shippingOptions,
  computation: (newOptions, previous) =>
    newOptions.find(o => o.id === previous?.value.id) ?? newOptions[0],
})
```

Ojo: cuando usas `previous` tienes que pasar los genéricos explícitamente (primero el tipo de la fuente, luego el del resultado). También existe la opción `equal` para controlar cuándo se notifica a los dependientes, y la opción `set`, que permite que un signal escribible escriba de vuelta a su fuente, útil para pares como Celsius/Fahrenheit.

Mi regla: si el valor es derivado pero el usuario puede sobrescribirlo hasta que cambien las fuentes, es un `linkedSignal`.

## resource y httpResource: Datos Asíncronos como Signals

Casi todos mis componentes hacen el mismo baile: un request depende de un id, quieres `loading`, `error` y el valor, y tienes que cancelar los requests viejos. `resource` empaqueta eso:

```ts
import { resource, signal } from '@angular/core'

readonly orderId = signal('o-1001')

readonly order = resource({
  params: () => ({ id: this.orderId() }),
  loader: ({ params, abortSignal }) =>
    fetch(`/api/orders/${params.id}`, { signal: abortSignal }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json() as Promise<Order>
    }),
})
```

`params` es un cálculo reactivo. Cuando cambia un signal que lee, el loader se ejecuta de nuevo y el request en curso se aborta mediante `abortSignal`. Si `params` devuelve `undefined`, el resource se queda en `idle` y el loader no corre: así expresas "todavía no hagas el fetch".

El `ResourceRef` te da `value()`, `hasValue()`, `error()`, `isLoading()`, `status()` y `reload()`. Los estados son `idle`, `loading`, `reloading`, `resolved`, `local` y `error`. `reloading` conserva el valor anterior mientras el loader corre otra vez tras `reload()`, mientras que `loading` (cambiaron los params) no. También puedes escribir con `set()` y `update()`, lo que lo deja en `local`.

Una trampa: leer `value()` cuando el estado es `error` lanza una excepción. Protégete con `hasValue()`:

```html
@if (order.hasValue()) {
  <app-order-summary [order]="order.value()" />
} @else if (order.error()) {
  <p>Could not load the order.</p>
  <button (click)="order.reload()">Retry</button>
} @else if (order.isLoading()) {
  <p>Loading...</p>
}
```

`httpResource` es la misma idea sobre `HttpClient`, así que los interceptors aplican:

```ts
import { httpResource } from '@angular/common/http'

readonly products = httpResource<Product[]>(() => `/api/products?page=${this.page()}`)
```

Arranca de inmediato, cancela el request pendiente cuando cambia una dependencia y expone `value()`, `hasValue()`, `error()`, `isLoading()` y `progress()`. Hay variantes para otros tipos de respuesta (`httpResource.text`, `.blob`, `.arrayBuffer`) y una opción `parse`, que es donde conecto un validador de schemas (la documentación usa Zod) para que `value()` tenga un tipo verificado en runtime. La documentación desaconseja usarlo para mutaciones como POST o PUT; para eso sigue usando `HttpClient` directamente.

## Interop con RxJS: Dónde Sigue Ganando

`toSignal` y `toObservable` conectan ambos mundos:

```ts
import { toSignal, toObservable } from '@angular/core/rxjs-interop'
import { switchMap, debounceTime } from 'rxjs'

readonly query = signal('')

readonly results = toSignal(
  toObservable(this.query).pipe(
    debounceTime(300),
    switchMap(q => this.http.get<Product[]>(`/api/search?q=${q}`)),
  ),
  { initialValue: [] },
)
```

Los detalles que muerden: `toSignal` se suscribe de inmediato y se desuscribe cuando se destruye el dueño, necesita un contexto de inyección (o un `Injector`) y un error en el observable se relanza cuando lees el signal. `toObservable` usa un effect internamente, así que las actualizaciones rápidas se agrupan y solo ves el valor ya estable.

Este ejemplo también es mi respuesta a "¿debo reemplazar RxJS?". No. Debounce, cancelar con `switchMap`, reintentos con backoff, combinar streams en el tiempo: los operadores lo expresan mejor. Los signals son para estado; RxJS es para eventos en el tiempo. `resource` resuelve el caso "haz fetch cuando esto cambie", pero un buscador con debounce sigue siendo un stream.

## Errores Comunes

- Escribir signals dentro de un `effect` para derivar estado. Usa `computed` o `linkedSignal`.
- Llamar `input()`, `model()` o `toSignal()` fuera de un inicializador o contexto de inyección.
- Leer `resource.value()` en estado de error sin `hasValue()`.
- Olvidar que `computed` y `linkedSignal` son perezosos: solo calculan cuando se leen.
- Mutar objetos guardados en un signal. `set` con la misma referencia no notifica, así que mantén el estado inmutable. Hablé de esto en [WTF Is Immutability in JavaScript?](/es/blog/wtf-is-inmutability-in-js/).

## Puntos Clave

- Usa `input()`, `output()` y `model()` en componentes nuevos; meten los inputs al grafo de signals.
- `linkedSignal` es para estado derivado que el usuario puede sobrescribir hasta que cambie su fuente.
- `resource` y `httpResource` convierten la carga asíncrona en signals con estado, error y cancelación, pero eran experimentales en Angular 21 (estables desde v22.0 según la documentación actual).
- Protege `value()` con `hasValue()`.
- Deja RxJS para debounce, cancelación y todo lo que tenga forma de stream; conecta con `toSignal` y `toObservable`.

## Lecturas Recomendadas

- [linkedSignal (angular.dev)](https://angular.dev/guide/signals/linked-signal)
- [Async reactivity with resources](https://angular.dev/guide/signals/resource)
- [Making HTTP requests with httpResource](https://angular.dev/guide/http/http-resource)
- [Accepting data with input properties](https://angular.dev/guide/components/inputs)
- [RxJS interop](https://angular.dev/ecosystem/rxjs-interop)
- [API: resource](https://angular.dev/api/core/resource)
