---
title: "Angular Signals: A Practical Introduction"
description: "What signals are, why Angular added them, and how to start using them in your components today."
date: 2026-04-01
category: "Angular"
draft: false
---

# Angular Signals: A Practical Introduction

If you've been working with Angular for a while, you've probably heard about signals by now. They shipped as stable in Angular 17 and have quietly changed how we think about reactivity in the framework.

## What Problem Do They Solve?

The original Angular change detection model is powerful but blunt. When something changes, Angular runs `ChangeDetectionStrategy.Default` down the entire component tree. Even with `OnPush`, you're still working with Observables and manually triggering checks in places.

Signals introduce **fine-grained reactivity** — Angular knows *exactly* which values changed and which templates need to re-render. No more scanning the whole tree.

## The Basics

A signal is just a reactive value wrapper:

```typescript
import { signal, computed, effect } from '@angular/core'

const count = signal(0)

// Read
console.log(count()) // 0

// Write
count.set(1)
count.update(v => v + 1)

// Derived
const double = computed(() => count() * 2)

// Side effects
effect(() => {
  console.log('Count changed:', count())
})
```

## In a Component

```typescript
@Component({
  template: `<p>{{ count() }} — {{ double() }}</p>`
})
export class CounterComponent {
  count  = signal(0)
  double = computed(() => this.count() * 2)

  increment() { this.count.update(v => v + 1) }
}
```

No `subscribe()`. No `async` pipe. No manual unsubscription.

## When to Use Them

Signals shine for:
- Local component state
- Derived values that depend on other signals
- Replacing simple `BehaviorSubject` patterns

Keep RxJS for:
- HTTP requests
- Complex async workflows
- Time-based operations

The two work well together — `toSignal()` and `toObservable()` bridge them cleanly.

## The Bottom Line

Signals are not a replacement for Angular's entire reactivity model. They're a better primitive for synchronous, local state. Start small — pick one component and replace its local state with signals. You'll feel the difference immediately.
