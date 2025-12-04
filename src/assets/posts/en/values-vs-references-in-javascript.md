---
title: ⚛️ Values vs References in Javascript
date: 2025-12-04
description: Understanding the difference between values and references in JavaScript is essential to avoid bugs and write reliable, immutable code — especially when working with React state. This post breaks down primitive vs reference types, with clear examples and visual metaphors.
tags: [React, JavaScript, Web Development, Software Development]
slug: values-vs-references-in-javascript
author: Francisco Moreno
imageUrl: https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
---

## 🧠 Values vs References in JavaScript: What Every Developer Should Know

One of the most common sources of unexpected bugs in JavaScript is misunderstanding how values and references work. Whether you're dealing with React state or plain JS logic, this knowledge is key.

Let’s break it down:

### 1. 🧠 What Is a Primitive Value?

Primitive types include:

```tsx
(string, number, boolean, null, undefined, symbol, bigint);
```

These are **stored directly** in the variable. When you assign them to another variable, you're copying the value — **not a link** to the original.

**Example:**

```jsx
let a = 5;
let b = a;

b = 10;

console.log(a); // 5
console.log(b); // 10
```

🔍 `b` holds a copy of `a`'s value. Changing `b` doesn’t affect `a`.

---

### 2. 🧬 What Is a Reference?

Objects, arrays, and functions are **non-primitive (complex)** types. When assigned to a variable, JavaScript stores a **reference** (a pointer) to the object in memory — not the actual value.

**Example:**

```jsx
let person1 = { name: 'Francisco' };
let person2 = person1;

person2.name = 'Laura';

console.log(person1.name); // "Laura"
```

🔍 Both `person1` and `person2` point to the **same object** in memory. Changing one affects the other.

---

### 🛠 Key Differences

| Action           | Primitives (value)   | Objects/Arrays (reference) |
| ---------------- | -------------------- | -------------------------- |
| Assignment (=)   | Copies the value     | Copies the reference       |
| Comparison (===) | Compares values      | Compares references        |
| Modify one       | Doesn’t affect other | Affects the other          |

---

### 🎯 Visual Example

**Primitives:**

```jsx
let x = 100;
let y = x;

y += 50;

console.log(x); // 100
console.log(y); // 150

// They are copying the value
```

**Non-primitives (Complex):**

```jsx
let original = [1, 2, 3];
let copy = original;

copy.push(4);

console.log(original); // [1, 2, 3, 4] 😱

// They are copying the reference
```

---

### 🔐 How to Avoid Reference Bugs

When working with arrays or objects, use **immutable copies** instead of modifying directly.

**For arrays:**

```jsx
const newArray = [...original];
```

**For objects:**

```jsx
const newObject = { ...original };
```

For **deeply nested structures**, use:

- `structuredClone()`
- `lodash.cloneDeep()`
- or custom deep copy functions

---

### 🧪 Quick Test

What will this print?

```jsx
let a = { name: 'Ana' };
let b = a;
b.name = 'Luis';

console.log(a.name); // ?
```

**Answer:** `"Luis"` — because both `a` and `b` share the same reference.

---

Understanding this topic will help you debug faster, avoid mutability issues in React, and write more predictable JavaScript code.
