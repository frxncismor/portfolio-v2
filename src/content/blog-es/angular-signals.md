---
title: "Angular Signals: Introducción Práctica"
description: "Qué son los signals, por qué Angular los agregó, y cómo empezar a usarlos en tus componentes hoy."
date: 2026-04-01
category: "Angular"
draft: false
---

# Angular Signals: Introducción Práctica

Si venís trabajando con Angular hace un tiempo, seguro ya escuchaste hablar de los signals. Llegaron como estables en Angular 17 y cambiaron silenciosamente cómo pensamos la reactividad en el framework.

## ¿Qué Problema Resuelven?

El modelo original de detección de cambios de Angular es poderoso pero grueso. Cuando algo cambia, Angular recorre todo el árbol de componentes con `ChangeDetectionStrategy.Default`. Incluso con `OnPush`, seguís trabajando con Observables y disparando checks manualmente en varios lugares.

Los Signals introducen **reactividad de grano fino** — Angular sabe *exactamente* qué valores cambiaron y qué templates necesitan re-renderizarse. Sin más escaneos del árbol completo.

## Lo Básico

Un signal es simplemente un wrapper reactivo para un valor:

```typescript
import { signal, computed, effect } from '@angular/core'

const count = signal(0)

// Leer
console.log(count()) // 0

// Escribir
count.set(1)
count.update(v => v + 1)

// Derivado
const double = computed(() => count() * 2)

// Efectos secundarios
effect(() => {
  console.log('Count cambió:', count())
})
```

## En un Componente

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

Sin `subscribe()`. Sin pipe `async`. Sin desuscripción manual.

## Cuándo Usarlos

Los signals brillan para:
- Estado local del componente
- Valores derivados que dependen de otros signals
- Reemplazar patrones simples con `BehaviorSubject`

Mantené RxJS para:
- Requests HTTP
- Flujos async complejos
- Operaciones basadas en tiempo

Los dos trabajan bien juntos — `toSignal()` y `toObservable()` los conectan limpiamente.

## La Conclusión

Los Signals no son un reemplazo del modelo de reactividad completo de Angular. Son una mejor primitiva para el estado local y sincrónico. Empezá de a poco — elegí un componente y reemplazá su estado local con signals. Vas a sentir la diferencia de inmediato.
