---
title: "Angular Signals Beyond the Basics: linkedSignal, resource"
description: "Signal inputs, model(), linkedSignal, resource and httpResource in Angular 21: what each one is for, what is stable, and where RxJS still wins."
date: 2026-11-30
category: "Angular"
draft: false
---

# Angular Signals Beyond the Basics: linkedSignal and resource

**TL;DR:** `signal`, `computed` and `effect` cover the easy half of reactivity. The other half is state that resets when something else changes (`linkedSignal`) and async data that should behave like a signal (`resource` and `httpResource`). I also use signal-based `input()`, `output()` and `model()` everywhere now. Below is how each piece works, which ones are stable in Angular 21 and which are not, and where I still reach for RxJS.

In [Angular Signals: A Practical Introduction](/blog/angular-signals/) I covered the basics. That post is deliberately short. This one is the follow-up I wish I had when I started using signals in real components: forms with dependent selects, lists that load from an API, parent/child bindings.

## What Is Stable, What Is Not

Before the code, the status of each API. I checked the API reference on angular.dev for each one, so you do not have to guess:

| API | Status |
|---|---|
| `effect` | stable since v20.0 |
| `linkedSignal` | stable since v20.0 |
| `model()` | stable since v19.0 |
| `resource()` | experimental in the v21 docs; the current docs mark it stable since v22.0 |
| `httpResource` | the page I checked says stable since v22.0, so treat it as experimental on v21 |
| Signal Forms | shipped as experimental in v21 |

So on Angular 21, `resource` and `httpResource` work, but their API can still change between minor versions. I use them in side projects and keep them behind a small wrapper in anything I would hate to refactor. `linkedSignal` and `effect` are safe to use.

## Quick Recap, and When Not to Use effect

You have `signal` for writable state, `computed` for derived state, and `effect` for side effects. The rule I follow: an `effect` should talk to something outside the signal graph, such as `localStorage`, a chart library, or the DOM. If an effect reads a signal and writes another signal, you almost always wanted a `computed` or a `linkedSignal`.

```ts
// Smell: derived state built with an effect
effect(() => {
  this.total.set(this.items().reduce((sum, i) => sum + i.price, 0))
})

// Better
readonly total = computed(() => this.items().reduce((sum, i) => sum + i.price, 0))
```

## Signal Inputs, output() and model()

Decorator-based `@Input` and `@Output` still work. The docs say the signal-based functions are recommended for new projects, and I agree: inputs become signals you can use in `computed`, and a required input is checked at build time.

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

A few details from the docs worth remembering: `input.required` does not add `undefined` to the type, `input()` can take a `transform` (`booleanAttribute` and `numberAttribute` are built in), and `model()` automatically creates a `quantityChange` output, which is what makes `[(quantity)]` work. Model inputs do not support transforms.

In the parent, `[(quantity)]="selectedQty"` takes the signal itself, not its value.

## linkedSignal: Derived State You Can Overwrite

This is the one I was missing for years. Picture a shipping selector. The list of options depends on the destination country, and the user picks one. When the country changes the list changes, and the selection should reset. A `computed` cannot be written to, and a plain `signal` does not reset. An `effect` that resets it works but is the smell from above.

`linkedSignal` is a writable signal whose value is recomputed whenever its source changes:

```ts
import { linkedSignal } from '@angular/core'

readonly shippingOptions = computed(() => optionsFor(this.country()))

// Shorthand: resets to the first option whenever the options change
readonly selected = linkedSignal(() => this.shippingOptions()[0])

choose(option: ShippingOption) {
  this.selected.set(option) // user override
}
```

The longer form gives you access to the previous value, which lets you keep the selection when it is still valid:

```ts
readonly selected = linkedSignal<ShippingOption[], ShippingOption>({
  source: this.shippingOptions,
  computation: (newOptions, previous) =>
    newOptions.find(o => o.id === previous?.value.id) ?? newOptions[0],
})
```

Note that you have to pass the generic arguments (source type first, result type second) when you use `previous`. There is also an `equal` option to control when dependents are notified, and a `set` option that lets a writable signal write back to its source, useful for things like a Celsius/Fahrenheit pair.

My rule: if the value is derived but the user is allowed to override it until the inputs change, it is a `linkedSignal`.

## resource and httpResource: Async Data as Signals

Most components I write do the same dance: a request depends on an id, you want `loading`, `error` and the value, and you must cancel stale requests. `resource` packages that:

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

`params` is a reactive computation. When a signal it reads changes, the loader runs again and any in-flight request is aborted through `abortSignal`. If `params` returns `undefined`, the resource stays `idle` and the loader does not run, which is how you express "do not fetch yet".

The `ResourceRef` gives you `value()`, `hasValue()`, `error()`, `isLoading()`, `status()` and `reload()`. The statuses are `idle`, `loading`, `reloading`, `resolved`, `local` and `error`. `reloading` keeps the previous value while the loader runs again after `reload()`, whereas `loading` (params changed) does not. You can also write to it with `set()` and `update()`, which puts it in `local`.

One trap: reading `value()` while the status is `error` throws. Guard with `hasValue()`:

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

`httpResource` is the same idea on top of `HttpClient`, so interceptors apply:

```ts
import { httpResource } from '@angular/common/http'

readonly products = httpResource<Product[]>(() => `/api/products?page=${this.page()}`)
```

It starts eagerly, cancels the pending request when a dependency changes, and exposes `value()`, `hasValue()`, `error()`, `isLoading()` and `progress()`. There are variants for other response types (`httpResource.text`, `.blob`, `.arrayBuffer`) and a `parse` option, which is where I plug in a schema validator (the docs use Zod) so that `value()` has a type I actually checked at runtime. The docs advise against using it for mutations like POST or PUT; for those, keep using `HttpClient` directly.

## Interop with RxJS: Where It Still Wins

`toSignal` and `toObservable` bridge both worlds:

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

The details that bite: `toSignal` subscribes immediately and unsubscribes when the owner is destroyed, it needs an injection context (or an `Injector`), and an error in the observable is rethrown when you read the signal. `toObservable` uses an effect internally, so rapid updates are coalesced and you only see the settled value.

This example is also my answer to "should I replace RxJS?". No. Debouncing, cancelling with `switchMap`, retries with backoff, combining streams over time: operators still express this better than signals. Signals are for state; RxJS is for events over time. `resource` handles the "fetch when this changes" case, but a search box with debounce is still a stream.

## Common Mistakes

- Writing signals inside `effect` to derive state. Use `computed` or `linkedSignal`.
- Calling `input()`, `model()` or `toSignal()` outside an initializer or injection context.
- Reading `resource.value()` in an error state without `hasValue()`.
- Forgetting that `computed` and `linkedSignal` are lazy: they only compute when read.
- Mutating objects held in a signal. `set` with the same reference does not notify, so keep state immutable. I wrote about this in [WTF Is Immutability in JavaScript?](/blog/wtf-is-inmutability-in-js/).

## Key Takeaways

- Use `input()`, `output()` and `model()` for new components; they make inputs part of the signal graph.
- `linkedSignal` is for derived state the user can override until its source changes.
- `resource` and `httpResource` turn async loading into signals with status, error and cancellation, but they were experimental in Angular 21 (stable since v22.0 per the current docs).
- Guard `value()` with `hasValue()`.
- Keep RxJS for debounce, cancellation and anything shaped like a stream; bridge with `toSignal` and `toObservable`.

## Further Reading

- [linkedSignal (angular.dev)](https://angular.dev/guide/signals/linked-signal)
- [Async reactivity with resources](https://angular.dev/guide/signals/resource)
- [Making HTTP requests with httpResource](https://angular.dev/guide/http/http-resource)
- [Accepting data with input properties](https://angular.dev/guide/components/inputs)
- [RxJS interop](https://angular.dev/ecosystem/rxjs-interop)
- [API: resource](https://angular.dev/api/core/resource)
