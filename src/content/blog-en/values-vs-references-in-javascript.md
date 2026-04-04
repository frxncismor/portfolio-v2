---
title: "Values vs References in JavaScript"
description: "One of the most misunderstood concepts in JS. Understanding how values and references work will save you from bugs you can't explain."
date: 2026-03-20
category: "JavaScript"
draft: false
---

# Values vs References in JavaScript

This is the bug you've had a hundred times but couldn't name. You copy an object, change a property, and suddenly the original changed too. Or you pass an array to a function and it comes back different. Welcome to the value vs reference problem.

## Two Categories of Types

JavaScript has two categories of types, and they behave completely differently in memory.

**Primitive types** — stored by value:
- `string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`

**Reference types** — stored by reference:
- `object`, `array`, `function`

## Primitives: Copied by Value

When you assign a primitive, JavaScript copies the actual value.

```javascript
let a = 10
let b = a
b = 20

console.log(a) // 10 — unchanged
console.log(b) // 20
```

`b` got its own copy. Changing `b` has zero effect on `a`. Clean, predictable.

## Objects: Copied by Reference

When you assign an object, JavaScript copies the **reference** — a pointer to the same place in memory.

```javascript
const user = { name: 'Francisco', age: 29 }
const copy = user

copy.age = 30

console.log(user.age) // 30 — you changed the original
console.log(copy.age) // 30
```

`copy` and `user` point to the exact same object. This is the root of countless bugs.

## The Same Trap with Arrays

```javascript
const original = [1, 2, 3]
const copy = original

copy.push(4)

console.log(original) // [1, 2, 3, 4] — mutated
```

## How to Actually Copy

### Shallow Copy — Spread Operator

```javascript
const user = { name: 'Francisco', role: 'dev' }
const copy = { ...user }

copy.role = 'lead'

console.log(user.role) // 'dev' — safe
console.log(copy.role) // 'lead'
```

For arrays:

```javascript
const original = [1, 2, 3]
const copy = [...original]

copy.push(4)

console.log(original) // [1, 2, 3] — untouched
```

### The Shallow Copy Trap

Spread only goes one level deep. If your object has nested objects, the nested references are still shared.

```javascript
const user = { name: 'Francisco', address: { city: 'Houston' } }
const copy = { ...user }

copy.address.city = 'Monterrey'

console.log(user.address.city) // 'Monterrey' — still mutated!
```

### Deep Copy — `structuredClone`

For deeply nested structures, use the native `structuredClone`:

```javascript
const user = { name: 'Francisco', address: { city: 'Houston' } }
const copy = structuredClone(user)

copy.address.city = 'Monterrey'

console.log(user.address.city) // 'Houston' — safe
```

`structuredClone` is available in all modern browsers and Node.js 17+. No library needed.

## Functions and References

When you pass an object to a function, you're passing the reference. The function can mutate the original.

```javascript
function birthday(person) {
  person.age += 1 // mutates the original
}

const user = { name: 'Francisco', age: 29 }
birthday(user)

console.log(user.age) // 30
```

If you don't want that, spread inside the function:

```javascript
function birthday(person) {
  return { ...person, age: person.age + 1 }
}

const user = { name: 'Francisco', age: 29 }
const older = birthday(user)

console.log(user.age)  // 29 — untouched
console.log(older.age) // 30
```

## The Mental Model

Think of primitives as the value written on a piece of paper. Objects are a piece of paper with an *address* written on it — multiple people can have the same address, and if you change what's at that address, everyone sees it.

Once this clicks, a whole class of bugs becomes obvious before you even run the code.
