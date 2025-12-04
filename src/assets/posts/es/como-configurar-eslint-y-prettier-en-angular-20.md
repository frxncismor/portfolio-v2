---
title: Cómo Configurar ESLint y Prettier en tus Proyectos Angular ✨
date: 2025-12-04
description: Descubre cómo llevar tus proyectos en Angular a otro nivel con un código limpio, consistente y profesional. 💻✨ En estos posts te explico cómo configurar ESLint y Prettier en Angular, aprovechando las migraciones del propio framework y combinando linting, formateo y buenas prácticas de accesibilidad para que tu equipo se enfoque en entregar features, no en discutir el estilo de código.
tags: [Angular, JavaScript, Web Development, Software Development, ESLint, Prettier]
slug: como-configurar-eslint-y-prettier-en-angular-20
author: Francisco Moreno
imageUrl: https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=1206&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
---

# Cómo Configurar ESLint y Prettier en tus Proyectos Angular ✨

### Resumen 🧾

Para que tus proyectos en Angular sean escalables, legibles y fáciles de mantener, necesitas algo más que “código limpio” por intuición: necesitas **herramientas** que hagan cumplir las buenas prácticas de forma automática. 🛠️

Ahí es donde entran **ESLint** y **Prettier**. Combinados con las migraciones automáticas de Angular, te ayudan a:

- ✅ Detectar errores desde temprano
- 🎯 Mantener un estilo de código consistente
- ♿ Mejorar la accesibilidad
- 🔍 Reducir ruido en las revisiones de código

En esta guía veremos cómo configurar ESLint y Prettier en un proyecto Angular y cómo se complementan entre sí.

---

## 🧠 Por qué Importan las Convenciones de Código en Angular

Uno de los mayores retos en cualquier equipo de desarrollo es lograr que todos escriban código con un estilo **consistente**.

- Comillas simples vs comillas dobles
- Tabs vs espacios
- Dónde hacer saltos de línea
- Cómo nombrar componentes, directivas y servicios

Sin automatización, vas a gastar tiempo en las code reviews discutiendo estilo en lugar de enfocarte en la **lógica de negocio** y la **arquitectura**. 🏗️

Para evitar esto, usamos dos tipos de herramientas:

- 🧹 **Linters** – Analizan tu código y detectan problemas (malas prácticas, imports sin usar, temas de accesibilidad, etc.).
- 🎨 **Formateadores** – Aplican un estilo consistente (indentación, comillas, saltos de línea) de forma automática.

En el ecosistema TypeScript/Angular, la combinación más popular es **ESLint** + **Prettier**.

---

## 🤖 Deja que Angular te Ayude: Migraciones Automáticas

Angular incluye varias migraciones que mejoran tu código automáticamente. Una particularmente útil es **clean-up-unused-imports**.

### 🧼 Limpieza Automática de Importaciones no Utilizadas

Esta migración elimina imports de componentes, directivas o pipes que no se están utilizando en tus templates.

Pasos:

1. ⏹ Detén el servidor de desarrollo si está corriendo.
2. ▶️ Ejecuta:

```bash
ng generate @angular/core:clean-up-unused-imports

```

Angular escaneará tu proyecto y eliminará las importaciones que no se usan. Por ejemplo, si `HeaderComponent` está importado pero nunca se usa en ningún template, se eliminará.

**Beneficios:**

- 📦 Bundle final más pequeño
- 📚 Módulos más limpios y legibles
- 🧭 Menos confusión sobre qué componentes están realmente en uso

---

## 🧪 Configurando ESLint en un Proyecto Angular

Angular tiene una **guía de estilo oficial** con convenciones de nombres, responsabilidad única y mejores prácticas. Pero la documentación por sí sola no hace que el equipo la cumpla.

Para eso usamos **ESLint**. ✅

### ⚙️ Instalación y Configuración de ESLint

Ejecuta:

```bash
ng add @angular-eslint/schematics

```

Esto hará:

- 📦 Instalar ESLint y el plugin de Angular ESLint
- 📝 Crear el archivo de configuración `.eslintrc.js` (o similar)
- 🔄 Actualizar `package.json` y `angular.json`

Luego puedes ejecutar:

```bash
ng lint

```

Esto mostrará advertencias y errores agrupados por severidad. Problemas típicos que detecta ESLint:

- 🚫 Importaciones no utilizadas
- 🧱 Constructores vacíos
- 🏷️ Convenciones de nombres incorrectas
- ♿ Problemas básicos de accesibilidad en templates

### 🔧 Corrección Automática de Problemas

Para corregir automáticamente todo lo que se pueda ajustar de forma segura:

```bash
ng lint --fix

```

ESLint resolverá muchos temas de estilo y lógica simple de manera automática. Los problemas más serios seguirán requiriendo revisión manual. 👀

---

## 🩺 Cómo Corregir Problemas Comunes con ESLint

### 📄 En Archivos TypeScript

Problemas frecuentes y cómo solucionarlos:

1. **Importaciones no utilizadas**

   ➜ Elimina los imports que no estés usando.

2. **Constructores vacíos**

   ➜ Si tu constructor no hace nada, bórralo.

3. **Convenciones de nombres**

   ➜ Las directivas personalizadas deberían usar un prefijo como `app` para evitar colisiones:

   ```tsx
   @Directive({
     selector: '[appHighlight]',
   })

   ```

---

### 🧱 En Templates HTML (Accesibilidad)

ESLint también marca problemas de **accesibilidad** en tus templates de Angular.

Por ejemplo, si usas una etiqueta `<img>` como elemento clickeable:

```html
<img [src]="product.image" (click)="onSelect()" />
```

Hazla accesible así:

```html
<img
  [src]="product.image"
  (click)="onSelect()"
  tabindex="0"
  role="button"
  (keydown.enter)="onSelect()"
/>
```

- `tabindex="0"` → Permite enfocar el elemento con el teclado
- `role="button"` → Indica a los lectores de pantalla que se comporta como un botón
- `(keydown.enter)` → Permite activar la acción desde el teclado

**Por qué importa esto:**

- 💡 Mejor experiencia para usuarios con discapacidad
- 📏 Mejor cumplimiento de estándares web
- 🚀 Mejor usabilidad y, muchas veces, mejor SEO

Instala la extensión de **ESLint** en tu IDE para ver los problemas resaltados en tiempo real. 🧠

---

## 🧩 ¿Cuál es la Diferencia entre ESLint y Prettier?

Antes de configurar Prettier, aclaremos los roles:

- **ESLint** → Calidad de código: malas prácticas, bugs, accesibilidad, variables sin usar, etc.
- **Prettier** → Formato de código: indentación, espacios, comillas, longitud de línea, etc.

La documentación de ESLint recomienda usar Prettier como **complemento** cuando quieres un formato consistente en todo el equipo. 🤝

---

## 🛠 Instalación y Configuración de Prettier en Angular

### 1️⃣ Instalar Prettier

```bash
npm install prettier -D

```

El flag `-D` (`--save-dev`) indica que es una dependencia de desarrollo.

### 2️⃣ Agregar un Script de npm

En tu `package.json`:

```json
"scripts": {
  "format": "prettier --write ."
}

```

Ahora puedes formatear todo el proyecto con:

```bash
npm run format

```

Y si quieres limitarlo a `src`:

```json
"format": "prettier --write src"

```

### 3️⃣ Crear un Archivo de Configuración de Prettier

Agrega un `.prettierrc.json` (o `.prettierrc`) en la raíz del proyecto:

```json
{
  "tabWidth": 2,
  "useTabs": false,
  "singleQuote": true,
  "semi": true
}
```

Opciones comunes:

- `tabWidth` – Espacios por nivel de indentación
- `useTabs` – Si usar tabs en lugar de espacios
- `singleQuote` – Preferir comillas simples sobre dobles
- `semi` – Añadir punto y coma al final de las sentencias

---

## 🤝 Integrando Prettier con ESLint

Para que ESLint y Prettier trabajen juntos sin conflictos, instala:

```bash
npm install eslint-config-prettier eslint-plugin-prettier -D

```

Estos paquetes:

- 🚫 Deshabilitan reglas de ESLint que entren en conflicto con Prettier
- 📣 Permiten que ESLint reporte problemas de formato de Prettier

### 🧩 Actualizar la Configuración de ESLint

En `.eslintrc.js`:

```jsx
module.exports = {
  // configuración existente...
  extends: [
    // otras configuraciones...
    'plugin:prettier/recommended',
  ],
  overrides: [
    {
      files: ['*.ts'],
      extends: [
        // otras configuraciones...
        'plugin:prettier/recommended',
      ],
    },
    {
      files: ['*.html'],
      extends: [
        // otras configuraciones...
        'plugin:prettier/recommended',
      ],
    },
  ],
};
```

**Qué obtienes con esto:**

- 🔍 ESLint muestra problemas de estilo y formato detectados por Prettier
- ⚖️ Reglas conflictivas de ESLint se desactivan automáticamente
- 🧵 Ambas herramientas trabajan en un flujo unificado y consistente

---

## 💅 Cómo Mejora Prettier tu Código Angular

### 🧱 En HTML

Prettier reestructura etiquetas largas para que sean más legibles:

```html
<!-- Antes -->
<img src="assets/logo.png" alt="Logo" class="header-logo" width="100" height="50" />

<!-- Después -->
<imgsrc ="assets/logo.png" alt="Logo" class="header-logo" width="100" height="50" />
```

Esto hace que los atributos sean más fáciles de leer y mantener. 👀

### 📜 En TypeScript

Prettier normaliza indentación, espacios y comillas:

```tsx
// Antes (inconsistente)
function calculateTotal(items) {
  return items.reduce((total, item) => {
    return total + item.price;
  }, 0);
}

// Después (formateado)
function calculateTotal(items) {
  return items.reduce((total, item) => {
    return total + item.price;
  }, 0);
}
```

### 🅰️ Compatibilidad con Angular

Prettier soporta la sintaxis moderna de Angular, así que tus templates y nuevas características se formatean correctamente. ✅

---

## 📁 Ejemplo de Configuración de Prettier para Angular

Aquí tienes un ejemplo completo para `.prettierrc.json` que funciona muy bien en proyectos Angular:

```json
{
  "tabWidth": 2,
  "useTabs": false,
  "singleQuote": true,
  "semi": true,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "trailingComma": "es5",
  "bracketSameLine": true,
  "printWidth": 80,
  "overrides": [
    {
      "files": "*.html",
      "options": {
        "parser": "html"
      }
    },
    {
      "files": "*.component.html",
      "options": {
        "parser": "angular"
      }
    }
  ]
}
```

---

## 🚀 Conclusión

Combinar:

- 🧹 Las migraciones de Angular (como `clean-up-unused-imports`),
- 🧪 ESLint (para calidad de código y accesibilidad), y
- 🎨 Prettier (para formato consistente)

le da a tu equipo una red de seguridad automática muy potente.

Pasas menos tiempo discutiendo estilo y limpiando imports, y más tiempo en lo que realmente importa: **entregar funcionalidades que aportan valor a tus usuarios**. 💼

¿Ya integraste ESLint y Prettier en tus proyectos Angular? ¿Qué problemas interesantes te ayudó a encontrar ESLint? Te leo en los comentarios. 💬

### Summary 🧾

To keep your Angular projects scalable, readable, and maintainable, you need more than just "clean code" by intuition—you need **tools** that enforce good practices automatically. 🛠️

That's where **ESLint** and **Prettier** come in. Combined with Angular's automatic migrations, they help you:

- ✅ Catch errors early
- 🎯 Maintain consistent code style
- ♿ Improve accessibility
- 🔍 Reduce noise in code reviews

This guide walks through configuring ESLint and Prettier in an Angular project and shows how they complement each other.

---

## 🧠 Why Code Conventions Matter in Angular

One of the biggest challenges in any dev team is getting everyone to write code in a **consistent style**.

- ' vs " (single vs double quotes)
- Tabs vs spaces
- Where to add line breaks
- How to name components, directives, and services

Without automation, you'll waste time in code reviews debating style instead of focusing on **business logic** and **architecture**. 🏗️

To avoid this, we use two types of tools:

- 🧹 **Linters** – Analyze your code and detect problems (bad practices, unused imports, accessibility issues, etc.).
- 🎨 **Formatters** – Enforce consistent style (indentation, quotes, line breaks) automatically.

In the TypeScript/Angular ecosystem, the most popular combination is **ESLint** + **Prettier**.

---

## 🤖 Let Angular Help You: Automatic Migrations

Angular includes several migrations that improve your code automatically. One particularly useful migration is **clean-up-unused-imports**.

### 🧼 Clean Up Unused Imports Automatically

This migration removes unused imports of components, directives, or pipes from your templates.

Steps:

1. ⏹ Stop your dev server if it's running.
2. ▶️ Run:

```bash
ng generate @angular/core:clean-up-unused-imports

```

Angular will scan your project and remove unused imports. For example, if `HeaderComponent` is imported but never used in any template, it will be removed.

**Benefits:**

- 📦 Smaller final bundle
- 📚 Cleaner, more readable modules
- 🧭 Less confusion about which components are in use

---

## 🧪 Setting Up ESLint in an Angular Project

Angular has an official **Angular Style Guide** covering naming conventions, single responsibility, and best practices. But documentation alone doesn't enforce anything.

That's what **ESLint** is for. ✅

### ⚙️ Install and Configure ESLint

Run:

```bash
ng add @angular-eslint/schematics

```

This will:

- 📦 Install ESLint and the Angular ESLint plugin
- 📝 Create a `.eslintrc.js` (or similar) config file
- 🔄 Update `package.json` and `angular.json`

Then lint your project with:

```bash
ng lint

```

This shows warnings and errors grouped by severity. Common issues ESLint catches:

- 🚫 Unused imports
- 🧱 Empty constructors
- 🏷️ Wrong naming conventions
- ♿ Basic accessibility issues in templates

### 🔧 Auto-Fixing Issues

To automatically fix everything that's safely fixable:

```bash
ng lint --fix

```

ESLint will handle many style and simple logic issues automatically. More serious problems will still need manual attention. 👀

---

## 🩺 Fixing Common ESLint Issues

### 📄 In TypeScript Files

Common problems and their fixes:

1. **Unused imports**

   ➜ Remove the imports you're not using.

2. **Empty constructors**

   ➜ If your constructor does nothing, delete it.

3. **Naming conventions**

   ➜ Custom directives should use a prefix like `app` to avoid collisions:

   ```tsx
   @Directive({
     selector: '[appHighlight]',
   })

   ```

---

### 🧱 In HTML Templates (Accessibility)

ESLint also flags **accessibility** issues in your Angular templates.

For example, if you're using an `<img>` as a clickable element:

```html
<img [src]="product.image" (click)="onSelect()" />
```

Make it accessible with:

```html
<img
  [src]="product.image"
  (click)="onSelect()"
  tabindex="0"
  role="button"
  (keydown.enter)="onSelect()"
/>
```

- `tabindex="0"` → Enables keyboard focus
- `role="button"` → Tells screen readers it behaves like a button
- `(keydown.enter)` → Lets users trigger the action from the keyboard

**Why this matters:**

- 💡 Better experience for users with disabilities
- 📏 Better compliance with web standards
- 🚀 Often better SEO and overall usability

Install the **ESLint extension** in your IDE to see issues highlighted in real time. 🧠

---

## 🧩 What's the Difference Between ESLint and Prettier?

Before configuring Prettier, let's clarify their roles:

- **ESLint** → Code quality: bad practices, bugs, accessibility, unused variables, etc.
- **Prettier** → Code format: indentation, spaces, quotes, line length, etc.

The ESLint documentation recommends using Prettier as a **complement** when you care about consistent formatting across the team. 🤝

---

## 🛠 Installing and Configuring Prettier in Angular

### 1️⃣ Install Prettier

```bash
npm install prettier -D

```

The `-D` flag (`--save-dev`) marks it as a dev dependency.

### 2️⃣ Add an npm Script

In your `package.json`:

```json
"scripts": {
  "format": "prettier --write ."
}

```

Now format your entire project with:

```bash
npm run format

```

You can limit it to `src`:

```json
"format": "prettier --write src"

```

### 3️⃣ Create a Prettier Config File

Add a `.prettierrc.json` (or `.prettierrc`) at the root:

```json
{
  "tabWidth": 2,
  "useTabs": false,
  "singleQuote": true,
  "semi": true
}
```

Common options:

- `tabWidth` – Spaces per indentation level
- `useTabs` – Whether to use tabs instead of spaces
- `singleQuote` – Prefer single quotes over double quotes
- `semi` – Add semicolons at the end of statements

---

## 🤝 Integrating Prettier with ESLint

To make ESLint and Prettier work together without conflicts, install:

```bash
npm install eslint-config-prettier eslint-plugin-prettier -D

```

These packages:

- 🚫 Disable ESLint rules that conflict with Prettier
- 📣 Let ESLint report Prettier formatting issues

### 🧩 Update Your ESLint Config

In `.eslintrc.js`:

```jsx
module.exports = {
  // existing config...
  extends: [
    // other configs...
    'plugin:prettier/recommended',
  ],
  overrides: [
    {
      files: ['*.ts'],
      extends: [
        // other configs...
        'plugin:prettier/recommended',
      ],
    },
    {
      files: ['*.html'],
      extends: [
        // other configs...
        'plugin:prettier/recommended',
      ],
    },
  ],
};
```

**What you get:**

- 🔍 ESLint shows style and format issues detected by Prettier
- ⚖️ Conflicting ESLint rules are disabled
- 🧵 Both tools work in a single, consistent workflow

---

## 💅 How Prettier Improves Your Angular Code

### 🧱 In HTML

Prettier restructures long tags for better readability:

```html
<!-- Before -->
<img src="assets/logo.png" alt="Logo" class="header-logo" width="100" height="50" />

<!-- After -->
<imgsrc ="assets/logo.png" alt="Logo" class="header-logo" width="100" height="50" />
```

This makes attributes easier to scan and edit. 👀

### 📜 In TypeScript

Prettier normalizes indentation, spacing, and quotes:

```tsx
// Before (inconsistent)
function calculateTotal(items) {
  return items.reduce((total, item) => {
    return total + item.price;
  }, 0);
}

// After (formatted)
function calculateTotal(items) {
  return items.reduce((total, item) => {
    return total + item.price;
  }, 0);
}
```

### 🅰️ Angular Compatibility

Prettier supports modern Angular syntax, so your templates and new language features will be formatted correctly. ✅

---

## 📁 Example Prettier Configuration for Angular

Here's a complete example for `.prettierrc.json` that works well in Angular projects:

```json
{
  "tabWidth": 2,
  "useTabs": false,
  "singleQuote": true,
  "semi": true,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "trailingComma": "es5",
  "bracketSameLine": true,
  "printWidth": 80,
  "overrides": [
    {
      "files": "*.html",
      "options": {
        "parser": "html"
      }
    },
    {
      "files": "*.component.html",
      "options": {
        "parser": "angular"
      }
    }
  ]
}
```

---

## 🚀 Final Thoughts

Combining:

- 🧹 Angular's migrations (like `clean-up-unused-imports`),
- 🧪 ESLint (for code quality and accessibility), and
- 🎨 Prettier (for consistent formatting)

gives your team a powerful, automated safety net.

You spend less time debating style and cleaning up imports, and more time on what matters: **shipping features that bring value to your users**. 💼

Have you integrated ESLint and Prettier into your Angular projects? What issues did ESLint help you discover? Share your experience in the comments. 💬
