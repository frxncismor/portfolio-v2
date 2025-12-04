---
title: ⚛️ Valores vs Referencias en Javascript
date: 2025-12-04
description: Entender la diferencia entre valores y referencias en JavaScript es clave para evitar bugs y escribir código inmutable, especialmente al trabajar con el estado en React. En este post te explico los conceptos con ejemplos claros y consejos prácticos.
tags: [React, Javascript, Desarrollo Web]
slug: valores-vs-referencias-en-javascript
author: Francisco Moreno
imageUrl: https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
---

## 🧠 Valores vs Referencias en JavaScript: Lo Que Todo Dev Debe Saber

Uno de los errores más comunes en JavaScript es no entender cómo funcionan los **valores** y las **referencias**. Ya sea en estado de React o lógica común, este conocimiento es esencial.

Vamos por partes:

### 1. 🧠 ¿Qué es un valor primitivo?

Los tipos primitivos incluyen:

```tsx
(string, number, boolean, null, undefined, symbol, bigint);
```

Estos se almacenan **directamente** en la variable. Al asignarlos a otra variable, estás copiando el valor — **no un enlace** al original.

**Ejemplo:**

```jsx
let a = 5;
let b = a;

b = 10;

console.log(a); // 5
console.log(b); // 10
```

🔍 `b` es una copia del valor de `a`. Cambiar `b` no afecta a `a`.

---

### 2. 🧬 ¿Qué es una referencia?

Los objetos, arrays y funciones son tipos **no primitivos (complejos)**. Al asignarlos, JavaScript guarda una **referencia** (como un puntero) a la ubicación del objeto en memoria.

**Ejemplo:**

```jsx
let persona1 = { nombre: 'Francisco' };
let persona2 = persona1;

persona2.nombre = 'Laura';

console.log(persona1.nombre); // "Laura"
```

🔍 `persona1` y `persona2` apuntan al **mismo objeto**. Cambiar uno afecta al otro.

---

### 🛠 Diferencias clave

| Acción            | Primitivos (valor) | Complejos (referencia) |
| ----------------- | ------------------ | ---------------------- |
| Asignación (=)    | Copia el valor     | Copia la referencia    |
| Comparación (===) | Compara valores    | Compara referencias    |
| Modificar uno     | No afecta al otro  | Afecta al otro         |

---

### 🎯 Ejemplo visual

**Primitivos:**

```jsx
let x = 100;
let y = x;

y += 50;

console.log(x); // 100
console.log(y); // 150

// Están copiando valores
```

**No primitivos (Complejos):**

```jsx
let original = [1, 2, 3];
let copia = original;

copia.push(4);

console.log(original); // [1, 2, 3, 4] 😱

// Están copiando referencias
```

---

### 🔐 ¿Cómo evitar errores con referencias?

Cuando trabajes con arrays u objetos, **usa copias inmutables**.

**Para arrays:**

```jsx
const nuevoArray = [...original];
```

**Para objetos:**

```jsx
const nuevoObjeto = { ...original };
```

Para estructuras **anidadas o profundas**, usa:

- `structuredClone()`
- `lodash.cloneDeep()`
- o funciones personalizadas

---

### 🧪 Test rápido

¿Qué imprime este código?

```jsx
let a = { nombre: 'Ana' };
let b = a;
b.nombre = 'Luis';

console.log(a.nombre); // ?
```

**Respuesta:** `"Luis"` — porque `a` y `b` comparten la misma referencia.

---

Comprender este tema te permitirá evitar bugs, manejar mejor el estado en React y escribir código más limpio y predecible.
