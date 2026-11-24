---
title: "Immutability in TypeScript: readonly, as const, Readonly"
description: "How readonly, as const and Readonly<T> make the compiler enforce immutability, where they stop, and how to write a DeepReadonly type of your own."
date: 2026-12-28
category: "JavaScript"
cover: "frozen"
draft: false
---

# Immutability in TypeScript: readonly, as const and Readonly<T>

**TL;DR:** `Object.freeze` protects values at runtime and only one level deep. TypeScript's `readonly`, `as const` and `Readonly<T>` protect them at compile time and cost nothing at runtime. They are also shallow, and `readonly` does not stop aliasing. Used together with the non-mutating array methods (`toSorted`, `toReversed`, `toSpliced`, `with`), they make "never mutate" something the compiler checks instead of a code review comment.

This closes a small series. [WTF Is Immutability in JavaScript?](/blog/wtf-is-inmutability-in-js/) explained why mutation causes bugs, and [Values vs References in JavaScript](/blog/values-vs-references-in-javascript/) explained what is really copied when you assign. Here I move the rules into the type system. All examples compile with `strict` on TypeScript 5.9.

## Runtime vs Compile Time

`Object.freeze` changes the object. In strict mode, writing to a frozen property throws, otherwise it is silently ignored, and it only freezes the top level.

TypeScript's modifiers change what the compiler accepts. After compilation they are gone: no frozen object, no overhead, and no protection against code that bypasses the types (`any`, casts, JavaScript callers). The two tools complement each other. In practice I use types by default and `freeze` only for a few constants that cross a trust boundary.

## readonly on Properties and Arrays

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

`readonly OrderLine[]` is shorthand for `ReadonlyArray<OrderLine>`. It removes every mutating method (`push`, `splice`, `sort`, `reverse`...) from the type. That is the part I rely on most: **function parameters**. If a function only reads an array, type it as `readonly T[]`. Callers can pass a mutable or a readonly array, and you have documented that you will not touch it.

```ts
function orderTotal(lines: readonly OrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty * 10, 0)
}
```

### Two limits worth knowing

**`readonly` on a property is not deep.** It prevents reassigning the property, not mutating what it points to. `order.lines = []` fails; the line objects inside are safe only because I also marked their properties.

**Property `readonly` does not affect assignability.** The TypeScript handbook is explicit: TypeScript does not take `readonly` into account when checking whether two object types are compatible, so a readonly property can still change through an alias:

```ts
interface Person { name: string; age: number }
interface ReadonlyPerson { readonly name: string; readonly age: number }

const writable: Person = { name: 'Ana', age: 42 }
const readonlyView: ReadonlyPerson = writable // allowed

writable.age++
console.log(readonlyView.age) // 43
```

Arrays are stricter: `readonly string[]` is not assignable to `string[]`, because the mutable type has methods the readonly one lacks. So `const copy: OrderLine[] = order.lines` fails. This asymmetry between properties and arrays surprises people.

## as const: Literals That Stay Literal

`as const` freezes a literal expression at the type level: no widening, object properties become `readonly`, and array literals become `readonly` tuples.

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

You get a single source of truth: the object gives you runtime values to iterate or validate against, and the union type is derived from it. The same trick with an array:

```ts
const STATUSES = ['pending', 'paid', 'shipped'] as const
type Status = (typeof STATUSES)[number] // 'pending' | 'paid' | 'shipped'
```

It replaces most of what I used `enum` for.

Two things from the docs to remember. The assertion only applies to literal expressions, so `(60 * 60 * 1000) as const` is an error. And it only covers the literal itself: if the object contains a reference to an existing array, that array is still mutable.

### as const satisfies

When you want the literal types but also want the compiler to check the shape, combine them (TypeScript 4.9+):

```ts
const ROUTES = {
  home: '/',
  orders: '/orders',
} as const satisfies Record<string, `/${string}`>
```

If you later add `orders: 'orders'` the compiler complains, and `ROUTES.orders` still has the type `'/orders'`.

### The tuple gotcha

`as const` produces `readonly [10, 20]`. A function that takes `[number, number]` rejects it, even if it never mutates its argument. The fix is on the function side: accept `readonly [number, number]`.

```ts
function lineTotal([price, qty]: readonly [number, number]): number {
  return price * qty
}

lineTotal([12, 3] as const) // ok
```

## Readonly<T> and Building DeepReadonly

`Readonly<T>` marks every property of `T` as `readonly`. It is handy for function results and config objects:

```ts
interface Config {
  server: { port: number; hosts: string[] }
}

const config: Readonly<Config> = { server: { port: 80, hosts: [] } }

config.server = { port: 443, hosts: [] } // error
config.server.port = 443                 // allowed: it is shallow
```

For deep protection you need a recursive type. This is the one I use:

```ts
type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T
```

Mapped types over arrays and tuples keep their shape and make them readonly, so this handles nested arrays too:

```ts
declare const cfg: DeepReadonly<{
  server: { port: number; hosts: string[] }
  tags: [string, string]
}>

cfg.server.port = 1        // error
cfg.server.hosts.push('x') // error
cfg.tags[0] = 'y'          // error
```

Its limits: `Map`, `Set` and `Date` are objects with mutating methods that this type does not turn into read-only versions (use `ReadonlyMap` and `ReadonlySet` where it matters), and classes with private state are not covered. It is a tool for plain data. For anything bigger, look at Immer.

## Methods That Do Not Mutate

The array methods `sort`, `reverse` and `splice` mutate, and `readonly T[]` hides them. The ES2023 copying methods fill the gap:

| Mutating | Non-mutating |
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

They are available on readonly arrays, and MDN lists `toSorted` as widely available across browsers since July 2023. For the types you need `lib` set to `ES2023` or later in `tsconfig.json`.

## Where It Shows Up in Angular and Reducers

Signals compare values with `Object.is` by default, so a signal holding an array or object only notifies when you set a new reference. Typing the state as `readonly` turns the classic bug (pushing into the array and wondering why the template did not update) into a compile error:

```ts
import { signal } from '@angular/core'

readonly lines = signal<readonly OrderLine[]>([])

addLine(line: OrderLine) {
  this.lines.update(current => [...current, line])
}
// this.lines().push(line) -> compile error
```

The same applies to reducers: type the state as `DeepReadonly<State>` or mark its fields `readonly`, and the compiler rejects any reducer branch that mutates. It also helps `OnPush` components, which depend on reference changes.

## Key Takeaways

- Types protect at compile time with zero runtime cost; `Object.freeze` protects at runtime, one level deep. Neither is deep by default.
- Use `readonly T[]` for parameters that you only read.
- `readonly` on a property does not block aliasing through a mutable type.
- `as const` gives you literal types and a single source of truth for unions; add `satisfies` to check the shape.
- `Readonly<T>` is shallow; write a `DeepReadonly<T>` for plain data and know its limits.
- `toSorted`, `toReversed`, `toSpliced` and `with` let you stay immutable without copying by hand.

## Further Reading

- [TypeScript Handbook: Object Types (readonly)](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [TypeScript 3.4: const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html)
- [Utility types: Readonly](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [MDN: Array.prototype.toSorted()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted)
