---
title: "¿WTF Es La Inmutabilidad en JavaScript?"
description: "Deja de mutar tu estado. Esto es lo que la inmutabilidad realmente significa en JavaScript y por qué importa más de lo que crees."
date: 2026-03-10
category: "JavaScript"
draft: false
---

# ¿WTF Es La Inmutabilidad en JavaScript?

Lo escuchaste en code reviews: "no mutes el estado." Lo viste en la documentación de React, en las buenas prácticas de Angular, en guías de programación funcional. Pero ¿qué significa realmente — y por qué importa tanto?

## Mutación: La Raíz del Problema

Mutación significa **cambiar algo que ya existe en memoria**.

```javascript
const user = { name: 'Francisco', role: 'dev' }
user.role = 'lead' // mutación
```

Tomaste el objeto que existía y lo cambiaste en el lugar. ¿Simple? Sí. ¿Peligroso? Absolutamente — especialmente en codebases grandes.

## Por Qué La Mutación Genera Bugs

### Efectos Secundarios Inesperados

```javascript
function promote(user) {
  user.role = 'lead' // muta el original
  return user
}

const dev = { name: 'Francisco', role: 'dev' }
const lead = promote(dev)

console.log(dev.role)  // 'lead' — no querías esto
console.log(lead.role) // 'lead'
```

Llamaste a `promote` y obtuviste un lead — pero también cambiaste silenciosamente `dev`. Dos variables, una realidad rota.

### La Detección de Cambios Se Rompe en Frameworks

El `OnPush` de Angular y el `React.memo` de React comparan **referencias**. Si mutas un objeto, la referencia queda igual — el framework cree que nada cambió y no re-renderiza.

```javascript
// Esto rompe OnPush / React.memo
const items = []
items.push(newItem) // misma referencia, nunca se detecta el cambio

// Esto funciona
const items = [...oldItems, newItem] // nueva referencia, cambio detectado siempre
```

## Inmutabilidad: Nunca Cambiar, Siempre Reemplazar

El enfoque inmutable es simple: en vez de modificar algo, creas **algo nuevo** con el cambio aplicado.

```javascript
const user = { name: 'Francisco', role: 'dev' }

// Actualización inmutable
const promoted = { ...user, role: 'lead' }

console.log(user.role)     // 'dev' — original intacto
console.log(promoted.role) // 'lead'
```

## Patrones Inmutables para Arrays

| Operación | Mutable ❌ | Inmutable ✅ |
|-----------|-----------|-------------|
| Agregar elemento | `arr.push(x)` | `[...arr, x]` |
| Eliminar elemento | `arr.splice(i, 1)` | `arr.filter((_, idx) => idx !== i)` |
| Actualizar elemento | `arr[i] = x` | `arr.map((item, idx) => idx === i ? x : item)` |
| Ordenar | `arr.sort()` | `[...arr].sort()` |
| Invertir | `arr.reverse()` | `[...arr].reverse()` |

## `Object.freeze` — Inmutabilidad Forzada

Si quieres que JavaScript realmente prevenga la mutación:

```javascript
const config = Object.freeze({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
})

config.timeout = 10000 // ignorado silenciosamente en modo normal, error en strict mode
console.log(config.timeout) // 5000
```

Nota: `freeze` es superficial. Los objetos anidados siguen siendo mutables. Usa `structuredClone` + `freeze` para inmutabilidad profunda, o una librería como `immer`.

## Immer: Inmutabilidad con Sintaxis Mutable

Cuando tus actualizaciones son complejas, la notación de spread se vuelve horrible. `immer` te permite escribir código de estilo mutación que produce resultados inmutables:

```javascript
import { produce } from 'immer'

const state = { users: [{ id: 1, name: 'Francisco', active: true }] }

const nextState = produce(state, (draft) => {
  draft.users[0].active = false // parece mutación, no lo es
})

console.log(state.users[0].active)     // true — original intacto
console.log(nextState.users[0].active) // false
```

`immer` se usa internamente en Redux Toolkit. Si usas NgRx, los mismos patrones aplican.

## La Regla

Simple de enunciar, difícil de internalizar:

> **Nunca modificar. Siempre devolver algo nuevo.**

Suena a más trabajo. En realidad es menos trabajo — porque dejas de debuggear por qué algo cambió cuando no lo esperabas. El estado predecible vale cada spread operator extra.
