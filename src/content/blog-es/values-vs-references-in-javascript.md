---
title: "Valores vs Referencias en JavaScript"
description: "Uno de los conceptos más malentendidos en JS. Entender cómo funcionan los valores y las referencias te va a salvar de bugs que no puedes explicar."
date: 2026-03-20
category: "JavaScript"
draft: false
---

# Valores vs Referencias en JavaScript

Este es el bug que tuviste mil veces pero no podías nombrar. Copias un objeto, cambias una propiedad, y de repente el original también cambió. O pasas un array a una función y vuelve diferente. Bienvenido al problema de valores vs referencias.

## Dos Categorías de Tipos

JavaScript tiene dos categorías de tipos, y se comportan de manera completamente diferente en memoria.

**Tipos primitivos** — guardados por valor:
- `string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`

**Tipos de referencia** — guardados por referencia:
- `object`, `array`, `function`

## Primitivos: Copiados por Valor

Cuando asignas un primitivo, JavaScript copia el valor real.

```javascript
let a = 10
let b = a
b = 20

console.log(a) // 10 — sin cambios
console.log(b) // 20
```

`b` tiene su propia copia. Cambiar `b` no tiene ningún efecto en `a`. Limpio, predecible.

## Objetos: Copiados por Referencia

Cuando asignas un objeto, JavaScript copia la **referencia** — un puntero al mismo lugar en memoria.

```javascript
const user = { name: 'Francisco', age: 29 }
const copy = user

copy.age = 30

console.log(user.age) // 30 — modificaste el original
console.log(copy.age) // 30
```

`copy` y `user` apuntan exactamente al mismo objeto. Aquí está la raíz de incontables bugs.

## La Misma Trampa con Arrays

```javascript
const original = [1, 2, 3]
const copy = original

copy.push(4)

console.log(original) // [1, 2, 3, 4] — mutado
```

## Cómo Copiar de Verdad

### Copia Superficial — Spread Operator

```javascript
const user = { name: 'Francisco', role: 'dev' }
const copy = { ...user }

copy.role = 'lead'

console.log(user.role) // 'dev' — seguro
console.log(copy.role) // 'lead'
```

Para arrays:

```javascript
const original = [1, 2, 3]
const copy = [...original]

copy.push(4)

console.log(original) // [1, 2, 3] — intacto
```

### La Trampa de la Copia Superficial

El spread solo va un nivel de profundidad. Si tu objeto tiene objetos anidados, las referencias anidadas siguen siendo compartidas.

```javascript
const user = { name: 'Francisco', address: { city: 'Houston' } }
const copy = { ...user }

copy.address.city = 'Monterrey'

console.log(user.address.city) // 'Monterrey' — igual se muteó!
```

### Copia Profunda — `structuredClone`

Para estructuras profundamente anidadas, usa el nativo `structuredClone`:

```javascript
const user = { name: 'Francisco', address: { city: 'Houston' } }
const copy = structuredClone(user)

copy.address.city = 'Monterrey'

console.log(user.address.city) // 'Houston' — seguro
```

`structuredClone` está disponible en todos los navegadores modernos y Node.js 17+. Sin librerías.

## Funciones y Referencias

Cuando pasas un objeto a una función, estás pasando la referencia. La función puede mutar el original.

```javascript
function birthday(person) {
  person.age += 1 // muta el original
}

const user = { name: 'Francisco', age: 29 }
birthday(user)

console.log(user.age) // 30
```

Si no quieres eso, haz spread dentro de la función:

```javascript
function birthday(person) {
  return { ...person, age: person.age + 1 }
}

const user = { name: 'Francisco', age: 29 }
const older = birthday(user)

console.log(user.age)  // 29 — intacto
console.log(older.age) // 30
```

## El Modelo Mental

Piensa en los primitivos como el valor escrito en un papel. Los objetos son un papel con una *dirección* escrita — varias personas pueden tener la misma dirección, y si cambias lo que hay ahí, todos lo ven.

Cuando esto hace clic, toda una clase de bugs se vuelve obvia antes de correr el código.
