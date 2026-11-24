---
title: "Angular 21 Without Zone.js: What Changes, How to Migrate"
description: "Zoneless is the default in Angular 21. What triggers change detection now, how to remove zone.js, what breaks, and how SSR and tests behave."
date: 2027-01-11
category: "Angular"
cover: "zoneless"
draft: false
---

# Going Zoneless in Angular 21: What Changes and How to Migrate

**TL;DR:** In Angular 21 zoneless change detection is the default, per the official docs. Angular no longer patches every async API to find out when to render. It re-renders when a signal read by a template changes, when a template event fires, when `markForCheck` is called (the `async` pipe does it for you), or when you call `ComponentRef.setInput`. Migrating an existing app means removing `zone.js` from the build, fixing the places where you mutated plain fields from timers or callbacks, and registering async work during SSR with `PendingTasks`. Below is the order I follow and what bites.

This post builds on two others: [Angular Signals: A Practical Introduction](/blog/angular-signals/) for the mental model, and [Angular Signals Beyond the Basics](/blog/angular-signals-linkedsignal-resource/) for `linkedSignal` and `resource`. If you also read [Immutability in TypeScript](/blog/typescript-immutability-readonly-as-const/), the same discipline applies here: without zones, change has to be visible as a new value, not hidden in a mutation.

## What Zone.js Did, and Why It Goes

Zone.js monkey-patches browser APIs (`setTimeout`, promises, event listeners, XHR) so Angular finds out when any async task finishes. After each one, Angular runs change detection over the tree. It works without you thinking about it, which is why it lasted so long. The cost is that Angular checks more often than needed, async code runs through patched APIs (which also shows up in stack traces), and an extra library ships with every app.

Signals invert the model. Angular knows which templates read which signals, so it can schedule a render when a signal changes, not when something, anywhere, happened. Zoneless is the end of that road.

## Stability: What Is Default and What Is Not

I checked the docs for the pieces this post touches:

- `provideZonelessChangeDetection` is stable since v20.2 (API reference).
- The zoneless guide states that from v21 zoneless is the default, so no setup is needed. It tells you to make sure `provideZoneChangeDetection` is not used anywhere to override it.
- `provideCheckNoChangesConfig`, the debugging aid I mention later, is in developer preview.
- Signal Forms shipped as experimental in v21, so I do not build on them here.

If you are on v20, you opt in explicitly:

```ts
import { bootstrapApplication } from '@angular/platform-browser'
import { provideZonelessChangeDetection } from '@angular/core'

bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection()],
})
```

## What Triggers Change Detection Now

From the docs, a render is scheduled by:

- `ChangeDetectorRef.markForCheck`, which `AsyncPipe` calls automatically
- `ComponentRef.setInput`
- updating a signal that a template reads
- a bound host or template listener callback
- attaching a view that was marked dirty by one of the above

Notice what is not on the list: a `setTimeout`, a resolved promise, a `fetch` callback. Those used to trigger a render because zone.js told Angular they ran. Now they only matter if they end up in one of the five items above.

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

That is the whole migration for most components: state that a template reads goes into a signal. It is why I did the signals work first.

## Migrating an Existing App

My order, which follows the docs:

1. **Make components signal-friendly.** Move template-read state to signals. Add `ChangeDetectionStrategy.OnPush` to components as you touch them. The docs say OnPush is recommended but not required for zoneless; it keeps you honest because it fails loudly when state is mutated in place.
2. **Make zoneless explicit while you test.** On v20, add `provideZonelessChangeDetection()`. On v21 it is the default, but if the app still has `provideZoneChangeDetection()` somewhere, remove it for the check.
3. **Remove zone.js.** Delete `zone.js` and `zone.js/testing` from the `polyfills` option of the `build` and `test` targets in `angular.json`. If you have a `polyfills.ts`, remove the `zone.js` imports. Then `npm uninstall zone.js`.
4. **Replace stability hooks.** `NgZone.onMicrotaskEmpty`, `onUnstable` and `onStable` never emit in zoneless apps, and `NgZone.isStable` is always `true`. Use `afterNextRender` for a single render or `afterEveryRender` for repeated work. For DOM state, use a `MutationObserver`. The docs say you can leave `NgZone.run` and `runOutsideAngular` in place, because removing them can hurt libraries used in apps that still run zone.js.
5. **Turn on the debug check while you migrate** (developer preview):

```ts
import { provideCheckNoChangesConfig } from '@angular/core'

providers: [
  provideCheckNoChangesConfig({ exhaustive: true, interval: 1000 }),
]
```

It periodically checks for bindings that changed without notification and throws `ExpressionChangedAfterItHasBeenCheckedError` when it finds one. That is how you find the plain field somebody mutated from a callback. Keep it for development builds.

## What Breaks

**Mutating plain fields from async code.** The example above. Search for `setTimeout`, `setInterval`, `.then(` and `subscribe(` blocks that assign to `this.something` used in a template.

**Reactive forms.** The docs call out that `setValue`, `patchValue` and `FormArray.push` do not schedule change detection. Either connect the form observables to `markForCheck()` or expose the data through signals (`toSignal(form.valueChanges)`).

**Third-party libraries.** Libraries that update their own state and expect zone.js to render will stop updating. Check each one for zoneless support; where there is none, call `markForCheck()` from the callback or wrap the value in a signal. Library components that host user components through `ViewContainerRef.createComponent` cannot use `OnPush`; the docs suggest they use the `Eager` strategy and notify Angular of changes.

**Tests.** `TestBed` is zoneless by default, even if `zone.js` is loaded through `polyfills`. Add `provideZoneChangeDetection()` to the test providers if one suite really needs zones. The docs recommend `await fixture.whenStable()` over `fixture.detectChanges()`; existing suites can keep `detectChanges()`.

```ts
it('shows the saved status', async () => {
  const fixture = TestBed.createComponent(StatusComponent)
  await fixture.whenStable()
  expect(fixture.nativeElement.textContent).toContain('saving')
})
```

`fakeAsync` is not covered in the zoneless guide. It comes from `zone.js/testing`, so once you remove zone.js from the `test` target, expect to replace it. I use the fake timers of the test runner instead of `fakeAsync`.

## SSR and Hydration Without Zones

During server rendering, Angular used zone.js to know when the app was "stable" and could be serialized. Without zones, you tell it about work that must finish before serialization using `PendingTasks`:

```ts
import { inject, PendingTasks } from '@angular/core'

const tasks = inject(PendingTasks)

tasks.run(async () => {
  const result = await loadRecommendations()
  this.recommendations.set(result)
})
```

For work that is not a single promise, `tasks.add()` returns a cleanup function to call in a `finally`. For RxJS, the `pendingUntilEvent()` operator from `rxjs-interop` keeps the app unstable until the observable emits, completes, errors or is unsubscribed. If you render on the server, as in my [SSR monorepo](/blog/angular-21-ssr-fastify-drizzle-monorepo/), audit any hand-written `setTimeout` or bare promise that sets state during render: those are the ones Angular no longer waits for on its own.

## Migration Checklist

- Template-read state lives in signals (or reaches the template through `async` or `toSignal`)
- Components use `OnPush` wherever possible
- `provideZoneChangeDetection` is gone, or deliberately kept where a legacy area needs it
- `zone.js` and `zone.js/testing` are out of `angular.json`, `polyfills.ts` and `package.json`
- Nothing depends on `NgZone.onStable`, `onMicrotaskEmpty` or `isStable`
- Reactive forms updates reach the template via `markForCheck` or signals
- Async work during SSR is registered with `PendingTasks`
- Tests use `await fixture.whenStable()` and no `fakeAsync`
- Third-party libraries checked for zoneless support
- `provideCheckNoChangesConfig` ran clean in development

## Key Takeaways

- Zoneless is the default in Angular 21; `provideZonelessChangeDetection` is stable since v20.2.
- Change detection runs on signal updates, template events, `markForCheck`, `setInput` and dirty view attachment, not on timers or promises.
- The main migration work is moving template-read state into signals.
- `NgZone` stability events do not fire; use `afterNextRender` and `afterEveryRender`.
- Register async work during SSR with `PendingTasks`.
- Use `provideCheckNoChangesConfig` (developer preview) in development to find silent mutations.

## Further Reading

- [Angular without ZoneJS (Zoneless)](https://angular.dev/guide/zoneless)
- [API: provideZonelessChangeDetection](https://angular.dev/api/core/provideZonelessChangeDetection)
- [Async reactivity with resources](https://angular.dev/guide/signals/resource)
- [RxJS interop](https://angular.dev/ecosystem/rxjs-interop)
