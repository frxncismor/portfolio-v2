---
title: "WTF Is Immutability in JavaScript?"
description: "Stop mutating your state. Here's what immutability actually means in JavaScript and why it matters more than you think."
date: 2026-03-10
category: "JavaScript"
draft: false
---

# WTF Is Immutability in JavaScript?

You've heard it in code reviews: "don't mutate the state." You've seen it in React docs, Angular best practices, functional programming guides. But what does it actually mean — and why does it matter so much?

## Mutation: The Root of the Problem

Mutation means **changing something that already exists in memory**.

```javascript
const user = { name: 'Francisco', role: 'dev' }
user.role = 'lead' // mutation
```

You took the object that existed and changed it in place. Simple? Yes. Dangerous? Absolutely — especially in large codebases.

## Why Mutation Causes Bugs

### Unexpected Side Effects

```javascript
function promote(user) {
  user.role = 'lead' // mutates the original
  return user
}

const dev = { name: 'Francisco', role: 'dev' }
const lead = promote(dev)

console.log(dev.role)  // 'lead' — you didn't want this
console.log(lead.role) // 'lead'
```

You called `promote` and got back a lead — but you also silently changed `dev`. Two variables, one broken reality.

### Change Detection Breaks in Frameworks

Angular's `OnPush` and React's `React.memo` compare **references**. If you mutate an object, the reference stays the same — the framework thinks nothing changed and doesn't re-render.

```javascript
// This breaks OnPush / React.memo
const items = []
items.push(newItem) // same reference, mutation detected = never

// This works
const items = [...oldItems, newItem] // new reference, change detected = always
```

## Immutability: Never Change, Always Replace

The immutable approach is simple: instead of modifying something, you create a **new thing** with the change applied.

```javascript
const user = { name: 'Francisco', role: 'dev' }

// Immutable update
const promoted = { ...user, role: 'lead' }

console.log(user.role)     // 'dev' — original untouched
console.log(promoted.role) // 'lead'
```

## Immutable Array Patterns

| Operation | Mutable ❌ | Immutable ✅ |
|-----------|-----------|-------------|
| Add item | `arr.push(x)` | `[...arr, x]` |
| Remove item | `arr.splice(i, 1)` | `arr.filter((_, idx) => idx !== i)` |
| Update item | `arr[i] = x` | `arr.map((item, idx) => idx === i ? x : item)` |
| Sort | `arr.sort()` | `[...arr].sort()` |
| Reverse | `arr.reverse()` | `[...arr].reverse()` |

## `Object.freeze` — Enforced Immutability

If you want JavaScript to actually prevent mutation:

```javascript
const config = Object.freeze({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
})

config.timeout = 10000 // silently ignored in sloppy mode, throws in strict mode
console.log(config.timeout) // 5000
```

Note: `freeze` is shallow. Nested objects are still mutable. Use `structuredClone` + `freeze` for deep immutability, or a library like `immer`.

## Immer: Immutability With Mutable Syntax

When your updates are complex, spread notation gets ugly fast. `immer` lets you write mutation-style code that produces immutable results:

```javascript
import { produce } from 'immer'

const state = { users: [{ id: 1, name: 'Francisco', active: true }] }

const nextState = produce(state, (draft) => {
  draft.users[0].active = false // looks like mutation, isn't
})

console.log(state.users[0].active)     // true — original intact
console.log(nextState.users[0].active) // false
```

`immer` is used internally by Redux Toolkit. If you're using NgRx, the same patterns apply.

## The Rule

Simple to state, hard to internalize:

> **Never modify. Always return something new.**

It sounds like extra work. It's actually less work — because you stop debugging why something changed when you didn't expect it to. Predictable state is worth every extra spread operator.
