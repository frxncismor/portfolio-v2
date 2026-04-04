---
title: "Cómo Es Ser Desarrollador Web en 2026"
description: "Las herramientas cambiaron. Los fundamentos, no. Así trabajo realmente en 2026 usando Claude Code, MCPs, skills y el stack de Gentle AI."
date: 2026-04-04
category: "AI"
draft: false
---

# Cómo Es Ser Desarrollador Web en 2026

La gente sigue preguntando si la IA reemplazó a los desarrolladores. No lo hizo. Lo que reemplazó es la excusa para no entender tu oficio. Déjame contarte cómo se ve mi flujo de trabajo real ahora.

## El Modelo Mental Del Que Todo Lo Demás Depende

La IA es una herramienta. Tú eres el arquitecto.

Si no sabes qué es el DOM, no puedes evaluar lo que escribió la IA. Si no entiendes change detection, no puedes detectar cuándo el componente Angular generado está mal. La brecha entre un desarrollador que usa IA y un desarrollador que *entiende* el output de la IA es exactamente la brecha entre alguien que conoce sus fundamentos y alguien que no.

La IA amplifica lo que ya eres. Esa es la parte de doble filo.

## Claude Code: No un Chatbot, un Colaborador

Trabajo con Claude Code como un sistema de sub-agentes. El modelo no me escribe código — trabaja *conmigo* dentro de un flujo estructurado. Yo defino la arquitectura. Yo defino el spec. Claude implementa, yo reviso y dirijo.

La diferencia clave con "el chatbot de IA escribe código" es la **agencia**. Sé qué estoy pidiendo y por qué. Cuando Claude se equivoca de camino, lo detecto porque entiendo cómo se ve lo correcto.

```bash
# Esto es mi terminal real la mayor parte del día
claude code
```

Eso es todo. La inteligencia está en la configuración, no en el comando.

## MCP Servers: Dándole Contexto Real al Agente

MCP (Model Context Protocol) es lo que hace que las herramientas de IA modernas sean realmente útiles. En vez de describir tu proyecto a la IA en cada mensaje, los servidores MCP inyectan contexto en vivo: tus docs de Notion, tu schema de base de datos, tus archivos de diseño, tu historial de git.

Uso varios MCPs en mi stack:

- **Engram** — memoria persistente entre sesiones. El agente recuerda qué decidimos la semana pasada.
- **Firebase** — acceso de lectura/escritura a la base de datos del proyecto
- **Playwright** — automatización del navegador para testing y verificación visual
- **Notion** — importa docs y specs del proyecto automáticamente
- **Pencil** — lee y escribe archivos de diseño

El resultado: el agente conoce el codebase, la historia, el diseño y el spec antes de que escriba una sola palabra.

## Skills: Codificar Buenas Prácticas Una Vez, Usarlas Siempre

Los skills son comportamientos reutilizables del agente. Piénsalos como una opinión de desarrollador senior codificada que se inyecta en cada tarea relevante.

Cuando construyo un componente Angular, el skill `angular-best-practices` se activa automáticamente. Le dice al agente: usa signals para el estado, solo componentes standalone, no ViewChild cuando funcionan los signals, reactive forms en vez de template-driven.

Escribí esas reglas una vez. Corren en cada tarea Angular, para siempre. Cero repetición. Cero "pero lo hiciste diferente la última vez."

El stack de [Gentle AI](https://github.com/Gentleman-Programming/gentle-ai) viene con un catálogo completo de skills para Angular, Go, React, testing, SDD y más. Un comando de instalación y tu agente tiene opiniones sobre tu stack.

## Context Window: El Constraint Más Malentendido

El context window es cuánto puede "ver" el modelo a la vez. La mayoría de la gente llega al límite y se confunde cuando el agente "olvida" lo que hablaron hace una hora.

La solución no es un modelo más grande — es **arquitectura de memoria**.

Uso Engram (un MCP de memoria persistente) para guardar decisiones, descubrimientos y convenciones *a medida que ocurren*. Cuando inicia una sesión, el agente carga los recuerdos relevantes primero. Cuando el contexto se llena, lo importante ya está persistido. No se pierde nada.

```
Sesión 1: Decidir arquitectura de auth → guardado en Engram
Sesión 2: Agente carga decisión de auth desde Engram antes de escribir código de auth
```

Esta es la diferencia entre un agente que construye incrementalmente y uno que reinventa la rueda en cada sesión.

## RAG: Retrieval Augmented Generation

RAG es cómo le das a una IA acceso a conocimiento para el que no fue entrenada — tus docs privados, los estándares de código de tu empresa, el spec que escribiste ayer.

En la práctica: en vez de meter todo un codebase en el context window, lo guardas en un formato buscable (Engram, una vector DB, etc.) y recuperas solo los fragmentos relevantes cuando se necesitan.

Para desarrollo, esto significa: escribe el spec una vez, y el agente lo recupera automáticamente al implementar. Escribe la decisión de arquitectura una vez, y siempre está disponible sin consumir tu budget de contexto.

## Fine-Tuning vs Prompting: Cuándo Usar Cada Uno

La gente llega al fine-tuning cuando debería usar mejor prompting — y viceversa.

**Usa prompting (skills/system prompt) cuando:**
- Quieres que el modelo siga convenciones específicas
- El comportamiento debe adaptarse al contexto
- Trabajas en tus proyectos o trabajo de cliente

**Usa fine-tuning cuando:**
- Tienes miles de pares de input/output correctos
- Necesitas que el modelo internalice un dominio muy específico
- El comportamiento es fijo y no necesita adaptarse

Para el 95% de los flujos de trabajo de desarrollo, skills + RAG + prompting estructurado supera al fine-tuning. El fine-tuning es caro, lento de iterar, y exagerado para la mayoría de los casos.

## El Stack de Gentle AI en Práctica

El [stack de Gentle AI](https://github.com/Gentleman-Programming/gentle-ai) es lo que une todo esto. Un comando de instalación configura:

- **8 agentes soportados** (Claude Code, Cursor, VS Code Copilot, etc.)
- **Engram** para memoria persistente
- **Flujo SDD** (Spec-Driven Development): explore → propose → spec → design → tasks → apply → verify
- **Catálogo de skills** en múltiples lenguajes y frameworks
- **Persona** — una persona de arquitecto senior que enseña mientras trabaja
- **Routing de modelo por fase** — Opus para decisiones de arquitectura, Sonnet para implementación

El flujo no es "pedirle a la IA que escriba una feature." Es:

1. **Explore** — el agente lee el codebase y mapea el problema
2. **Propose** — enfoque arquitectónico documentado
3. **Spec** — requerimientos escritos como escenarios Given/When/Then
4. **Design** — cambios de archivos, interfaces y decisiones documentadas
5. **Tasks** — checklist concreto
6. **Apply** — implementación contra el spec
7. **Verify** — verificar que lo construido coincide con lo especificado

Cada paso se guarda en Engram. Cada sesión retoma exactamente donde terminó la anterior.

## La Conclusión

El desarrollo en 2026 no es "prompting y rezar." Es:

- Los fundamentos siguen importando — más que nunca
- La IA amplifica tu comprensión, no la reemplaza
- La memoria, los skills y los flujos estructurados convierten un chatbot en un sistema
- Los desarrolladores que ganan ahora entienden sus herramientas en ambos niveles: la capa de IA y el código debajo de ella

Las herramientas cambiaron. El oficio, no. Todavía tienes que saber qué estás construyendo.
