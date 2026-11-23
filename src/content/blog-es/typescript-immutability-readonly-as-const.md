---
title: "Inmutabilidad en TypeScript: readonly, as const, Readonly"
description: "Cómo readonly, as const y Readonly<T> hacen que el compilador exija inmutabilidad, dónde se quedan cortos y cómo escribir tu propio DeepReadonly."
date: 2026-12-28
category: "JavaScript"
draft: false
---

# Inmutabilidad en TypeScript: readonly, as const y Readonly<T>

**TL;DR:** `Object.freeze` protege los valores en runtime y solo un nivel. `readonly`, `as const` y `Readonly<T>` de TypeScript los protegen en compilación y no cuestan nada en runtime. También son superficiales, y `readonly` no evita el aliasing. Junto con los métodos de arrays que no mutan (`toSorted`, `toReversed`, `toSpliced`, `with`), hacen que "nunca mutes" lo revise el compilador en lugar de un comentario en el code review.

Este post cierra una mini serie. [WTF Is Immutability in JavaScript?](/es/blog/wtf-is-inmutability-in-js/) explicó por qué la mutación causa bugs, y [Values vs References in JavaScript](/es/blog/values-vs-references-in-javascript/) explicó qué se copia realmente al asignar. Aquí llevo las reglas al sistema de tipos. Todos los ejemplos compilan con `strict` en TypeScript 5.9.

## Runtime vs Tiempo de Compilación

`Object.freeze` cambia el objeto. En modo estricto, escribir en una propiedad congelada lanza un error; si no, se ignora en silencio, y solo congela el primer nivel.

Los modificadores de TypeScript cambian lo que el compilador acepta. Tras compilar desaparecen: no hay objeto congelado, no hay costo y tampoco protección contra código que se salte los tipos (`any`, casts, llamadores en JavaScript). Las dos herramientas se complementan. En la práctica uso tipos por defecto y `freeze` solo en algunas constantes que cruzan una frontera de confianza.

## readonly en Propiedades y Arrays

```ts
interface OrderLine {
  readonly sku: string
  readonly qty: number
}

interface Order {
  readonly id: string
  readonly lines: readonly OrderLine[]
  note?: string
}

declare const order: Order

order.id = 'x'                           // error: read-only property
order.lines.push({ sku: 'b', qty: 2 })   // error: 'push' does not exist on 'readonly OrderLine[]'
order.note = 'gift'                      // fine
```

`readonly OrderLine[]` es azúcar para `ReadonlyArray<OrderLine>`. Quita del tipo todos los métodos que mutan (`push`, `splice`, `sort`, `reverse`...). Es lo que más aprovecho en los **parámetros de funciones**: si una función solo lee un array, tipéalo como `readonly T[]`. Quien llama puede pasar un array mutable o de solo lectura, y dejas documentado que no lo vas a tocar.

```ts
function orderTotal(lines: readonly OrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty * 10, 0)
}
```

### Dos límites que conviene conocer

**`readonly` en una propiedad no es profundo.** Evita reasignar la propiedad, no mutar lo que apunta. `order.lines = []` falla; los objetos de línea están a salvo solo porque también marqué sus propiedades.

**El `readonly` de propiedades no afecta la asignabilidad.** El handbook de TypeScript lo dice explícitamente: TypeScript no toma en cuenta `readonly` al comprobar si dos tipos de objeto son compatibles, así que una propiedad de solo lectura puede cambiar mediante un alias:

```ts
interface Person { name: string; age: number }
interface ReadonlyPerson { readonly name: string; readonly age: number }

const writable: Person = { name: 'Ana', age: 42 }
const readonlyView: ReadonlyPerson = writable // allowed

writable.age++
console.log(readonlyView.age) // 43
```

Los arrays son más estrictos: `readonly string[]` no se puede asignar a `string[]`, porque el tipo mutable tiene métodos que el de solo lectura no. Así que `const copy: OrderLine[] = order.lines` falla. Esta asimetría entre propiedades y arrays sorprende a mucha gente.

## as const: Literales que Siguen Siendo Literales

`as const` congela una expresión literal a nivel de tipos: sin widening, las propiedades de objeto pasan a `readonly` y los arrays literales pasan a tuplas `readonly`.

```ts
const ORDER_STATUS = {
  pending: 'PENDING',
  paid: 'PAID',
  shipped: 'SHIPPED',
} as const
// { readonly pending: 'PENDING'; readonly paid: 'PAID'; readonly shipped: 'SHIPPED' }

type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]
// 'PENDING' | 'PAID' | 'SHIPPED'
```

Tienes una sola fuente de verdad: el objeto te da valores en runtime para iterar o validar, y el tipo unión se deriva de él. Lo mismo con un array:

```ts
const STATUSES = ['pending', 'paid', 'shipped'] as const
type Status = (typeof STATUSES)[number] // 'pending' | 'paid' | 'shipped'
```

Reemplaza la mayor parte de lo que antes hacía con `enum`.

Dos cosas de la documentación para recordar. La aserción solo aplica a expresiones literales, así que `(60 * 60 * 1000) as const` es un error. Y solo cubre el literal en sí: si el objeto contiene una referencia a un array existente, ese array sigue siendo mutable.

### as const satisfies

Cuando quieres los tipos literales pero también que el compilador verifique la forma, combínalos (TypeScript 4.9+):

```ts
const ROUTES = {
  home: '/',
  orders: '/orders',
} as const satisfies Record<string, `/${string}`>
```

Si después agregas `orders: 'orders'`, el compilador se queja, y `ROUTES.orders` conserva el tipo `'/orders'`.

### La trampa de las tuplas

`as const` produce `readonly [10, 20]`. Una función que recibe `[number, number]` lo rechaza, aunque nunca mute su argumento. La solución está del lado de la función: acepta `readonly [number, number]`.

```ts
function lineTotal([price, qty]: readonly [number, number]): number {
  return price * qty
}

lineTotal([12, 3] as const) // ok
```

## Readonly<T> y Cómo Construir DeepReadonly

`Readonly<T>` marca todas las propiedades de `T` como `readonly`. Es útil para resultados de funciones y objetos de configuración:

```ts
interface Config {
  server: { port: number; hosts: string[] }
}

const config: Readonly<Config> = { server: { port: 80, hosts: [] } }

config.server = { port: 443, hosts: [] } // error
config.server.port = 443                 // allowed: it is shallow
```

Para protección profunda necesitas un tipo recursivo. Este es el que uso:

```ts
type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T
```

Los mapped types sobre arrays y tuplas conservan su forma y los vuelven de solo lectura, así que esto también cubre arrays anidados:

```ts
declare const cfg: DeepReadonly<{
  server: { port: number; hosts: string[] }
  tags: [string, string]
}>

cfg.server.port = 1        // error
cfg.server.hosts.push('x') // error
cfg.tags[0] = 'y'          // error
```

Sus límites: `Map`, `Set` y `Date` son objetos con métodos que mutan y este tipo no los convierte en versiones de solo lectura (usa `ReadonlyMap` y `ReadonlySet` donde importe), y las clases con estado privado no quedan cubiertas. Es una herramienta para datos planos. Para algo más grande, mira Immer.

## Métodos que No Mutan

Los métodos de array `sort`, `reverse` y `splice` mutan, y `readonly T[]` los esconde. Los métodos de copia de ES2023 llenan el hueco:

| Muta | No muta |
|---|---|
| `arr.sort(fn)` | `arr.toSorted(fn)` |
| `arr.reverse()` | `arr.toReversed()` |
| `arr.splice(i, 1)` | `arr.toSpliced(i, 1)` |
| `arr[i] = x` | `arr.with(i, x)` |

```ts
const lines: readonly OrderLine[] = [
  { sku: 'b', qty: 2 },
  { sku: 'a', qty: 1 },
]

const bySku = lines.toSorted((x, y) => x.sku.localeCompare(y.sku))
const withoutFirst = lines.toSpliced(0, 1)
```

Están disponibles en arrays de solo lectura, y MDN marca `toSorted` como ampliamente disponible en navegadores desde julio de 2023. Para los tipos necesitas `lib` en `ES2023` o superior en `tsconfig.json`.

## Dónde Se Nota en Angular y en Reducers

Los signals comparan valores con `Object.is` por defecto, así que un signal con un array u objeto solo notifica cuando le asignas una referencia nueva. Tipar el estado como `readonly` convierte el bug clásico (hacer push al array y preguntarte por qué el template no se actualizó) en un error de compilación:

```ts
import { signal } from '@angular/core'

readonly lines = signal<readonly OrderLine[]>([])

addLine(line: OrderLine) {
  this.lines.update(current => [...current, line])
}
// this.lines().push(line) -> compile error
```

Lo mismo aplica a los reducers: tipa el estado como `DeepReadonly<State>` o marca sus campos `readonly`, y el compilador rechaza cualquier rama del reducer que mute. También ayuda a los componentes `OnPush`, que dependen de cambios de referencia.

## Puntos Clave

- Los tipos protegen en compilación sin costo en runtime; `Object.freeze` protege en runtime, un nivel. Ninguno es profundo por defecto.
- Usa `readonly T[]` en parámetros que solo lees.
- `readonly` en una propiedad no bloquea el aliasing a través de un tipo mutable.
- `as const` te da tipos literales y una sola fuente de verdad para uniones; agrega `satisfies` para verificar la forma.
- `Readonly<T>` es superficial; escribe un `DeepReadonly<T>` para datos planos y conoce sus límites.
- `toSorted`, `toReversed`, `toSpliced` y `with` te dejan ser inmutable sin copiar a mano.

## Lecturas Recomendadas

- [TypeScript Handbook: Object Types (readonly)](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [TypeScript 3.4: const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html)
- [Utility types: Readonly](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [MDN: Array.prototype.toSorted()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted)
