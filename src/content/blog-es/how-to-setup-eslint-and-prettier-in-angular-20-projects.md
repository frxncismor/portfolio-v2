---
title: "Cómo Configurar ESLint y Prettier en Proyectos Angular 20"
description: "Una guía completa y actualizada para configurar ESLint y Prettier en un proyecto Angular 20 nuevo — incluyendo las partes que la mayoría de las guías se saltan."
date: 2026-03-01
category: "Angular"
draft: false
---

# Cómo Configurar ESLint y Prettier en Proyectos Angular 20

Angular abandonó TSLint hace años y viene con soporte de ESLint via `@angular-eslint`. Pero hacer que ESLint y Prettier funcionen juntos — sin que se peleen — todavía le cuesta a la gente. Esta es la guía que me hubiera gustado tener.

## Qué Vas a Configurar

- **ESLint**: detecta problemas de calidad de código, aplica reglas
- **Prettier**: formatea código (indentación, comillas, largo de línea)
- **`eslint-config-prettier`**: desactiva las reglas de formateo de ESLint que conflictúan con Prettier
- **Husky + lint-staged**: ejecuta ambos en cada commit automáticamente

## Paso 1: Agregar Angular ESLint

Para un proyecto nuevo:

```bash
ng new my-app --strict
```

Para un proyecto existente:

```bash
ng add @angular-eslint/schematics
```

Esto agrega `@angular-eslint/eslint-plugin`, `@angular-eslint/template-parser`, y crea `eslint.config.js` (Angular 20 usa flat config por defecto).

## Paso 2: Instalar Prettier

```bash
npm install --save-dev prettier eslint-config-prettier
```

`eslint-config-prettier` es crítico — desactiva todas las reglas de ESLint que podrían conflictuar con las decisiones de formateo de Prettier.

## Paso 3: Configurar Prettier

Crea `.prettierrc` en la raíz del proyecto:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

Y `.prettierignore`:

```
dist/
.angular/
node_modules/
coverage/
```

## Paso 4: Actualizar `eslint.config.js`

Angular 20 genera flat config. Agrega `prettier` al extends para desactivar las reglas conflictivas:

```javascript
// eslint.config.js
import angular from 'angular-eslint'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
      prettier, // debe ir último — desactiva reglas conflictivas
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
)
```

## Paso 5: Agregar Scripts a `package.json`

```json
{
  "scripts": {
    "lint": "ng lint",
    "lint:fix": "ng lint --fix",
    "format": "prettier --write \"src/**/*.{ts,html,scss,css,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,html,scss,css,json}\""
  }
}
```

## Paso 6: Integración con VS Code

Instala las extensiones de ESLint y Prettier, luego agrega a `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[html]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Paso 7: Pre-commit Hook con Husky + lint-staged

```bash
npm install --save-dev husky lint-staged
npx husky init
```

Agrega a `package.json`:

```json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.html": ["prettier --write"],
    "*.{scss,css,json}": ["prettier --write"]
  }
}
```

Actualiza `.husky/pre-commit`:

```bash
npx lint-staged
```

Ahora cada commit se lintea y formatea automáticamente. Adiós a los "te olvidaste de formatear esto" en code reviews.

## Verificar Que Todo Funciona

```bash
npm run lint
npm run format:check
```

Ambos deberían pasar en un proyecto limpio. Si ESLint y Prettier conflictúan en algo, `eslint-config-prettier` está haciendo su trabajo — Prettier gana en formateo, ESLint gana en lógica.

Eso es todo. 10 minutos de setup, horas de debates de estilo ahorradas.
