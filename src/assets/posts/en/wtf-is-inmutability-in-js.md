---
title: ⚛️ WTF is inmutability in Javascript?
date: 2025-12-04
description: Learn what immutability really means in JavaScript and why it's crucial for React to detect state changes. This post breaks down the concept with clear examples, analogies, and tips to help you avoid unexpected bugs in your components.
tags: [React, Web Development, Javascript]
slug: wtf-is-inmutability-in-js
author: Francisco Moreno
imageUrl: https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
---

# 🔍 Understanding **Immutability** in JavaScript (and Why It Matters in React)

Immutability is one of those concepts that can feel abstract at first — but once you get it, it unlocks a deeper understanding of how frameworks like React work behind the scenes.

Let’s break it down.

## 🧠 What Is Immutability?

**Immutability** means that a value **cannot be changed after it’s created**.

Instead of modifying an existing value, you **create a new copy** with the changes applied.

## ⚛️ Why Does Immutability Matter in React?

React relies heavily on **reference comparison** to determine whether it should re-render a component. This is known as a **shallow comparison**.

- ✅ If you return a new reference (a new object or array), React sees that as a change → it **re-renders**.
- ❌ If you mutate an existing object or array, the reference stays the same → React thinks nothing has changed → **no re-render.**

## 🔁 Mutable vs Immutable Examples

### 🔴 Mutable (modifies the same reference)

```jsx
const list = [1, 2, 3];
list.push(4); // modifies the original array
console.log(list); // [1, 2, 3, 4]
```

Here you're **mutating** the original array. The same memory reference is modified.

---

### ✅ Immutable (creates a new reference)

```jsx
const list = [1, 2, 3];
const newList = [...list, 4]; // creates a new array
console.log(list); // [1, 2, 3]
console.log(newList); // [1, 2, 3, 4]
```

Using the **spread operator (`...`)**, we create a new array. React can now **detect the change** because the reference is different.

## 🧬 What About Objects?

### 🔴 Mutating an object

```jsx
const person = { name: 'Ana', age: 25 };
person.age = 26; // modifies the original object
```

### ✅ Creating a new object (immutable way)

```jsx
const person = { name: 'Ana', age: 25 };
const updatedPerson = { ...person, age: 26 };
```

You're not changing `person`, you're making a **new object** (`updatedPerson`) with the updated value.

---

## 🔍 React’s Shallow Comparison in Action

Let’s look at two scenarios:

```jsx
const newArray = oldArray;
```

> newArray === oldArray → React: "Nothing changed." → ❌ No re-render.

```jsx
const newArray = [...oldArray];
```

> newArray !== oldArray → React: "Something changed!" → ✅ Re-render.

That’s the power of **immutability** in React.

## 💡 Quick Analogy

Think of it like writing on paper:

- ✏️ **Mutability**: You erase something and write over the same sheet.
- 📝 **Immutability**: You grab a new sheet, apply your changes, and leave the original untouched.

React prefers the second approach.

## 🧪 What’s Mutable and What’s Not in JavaScript?

| Data Type | Mutable? | Example of Immutability                 |
| --------- | -------- | --------------------------------------- |
| `number`  | ❌ No    | `let x = 5` → can't change 5 itself     |
| `string`  | ❌ No    | `"hi".toUpperCase()` returns new string |
| `boolean` | ❌ No    | `true`, `false` are fixed               |
| `object`  | ✅ Yes   | Use `{ ...obj, newProp }`               |
| `array`   | ✅ Yes   | Use `[...arr, newItem]`                 |

---

## ✨ Final Thoughts

Understanding **immutability** helps you write better, more predictable code — especially in libraries like React, Redux, or any state-driven framework.

Start small: use the spread operator, avoid `push` or direct assignment, and always ask yourself: _“**Am I changing the original, or creating something new?**”_
