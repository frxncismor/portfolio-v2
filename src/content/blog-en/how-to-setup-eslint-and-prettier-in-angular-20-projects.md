---
title: "How to Setup ESLint and Prettier in Angular 20 Projects"
description: "A complete, up-to-date guide to wiring ESLint and Prettier into a fresh Angular 20 project — including the parts most guides skip."
date: 2026-03-01
category: "Angular"
draft: false
---

# How to Setup ESLint and Prettier in Angular 20 Projects

Angular dropped TSLint years ago and ships with ESLint support via `@angular-eslint`. But getting ESLint and Prettier working together — without them fighting each other — still trips people up. This is the guide I wish I had.

## What You're Setting Up

- **ESLint**: catches code quality issues, enforces rules
- **Prettier**: formats code (indentation, quotes, line length)
- **`eslint-config-prettier`**: disables ESLint formatting rules that conflict with Prettier
- **Husky + lint-staged**: runs both on every commit automatically

## Step 1: Add Angular ESLint

For a new project:

```bash
ng new my-app --strict
```

For an existing project:

```bash
ng add @angular-eslint/schematics
```

This adds `@angular-eslint/eslint-plugin`, `@angular-eslint/template-parser`, and creates `eslint.config.js` (Angular 20 uses flat config by default).

## Step 2: Install Prettier

```bash
npm install --save-dev prettier eslint-config-prettier
```

`eslint-config-prettier` is critical — it turns off all ESLint rules that could conflict with Prettier's formatting decisions.

## Step 3: Configure Prettier

Create `.prettierrc` at the project root:

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

And `.prettierignore`:

```
dist/
.angular/
node_modules/
coverage/
```

## Step 4: Update `eslint.config.js`

Angular 20 generates a flat config. Add `prettier` to the extends to disable conflicting rules:

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
      prettier, // must be last — disables conflicting rules
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

## Step 5: Add Scripts to `package.json`

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

## Step 6: VS Code Integration

Install the ESLint and Prettier extensions, then add to `.vscode/settings.json`:

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

## Step 7: Pre-commit Hook with Husky + lint-staged

```bash
npm install --save-dev husky lint-staged
npx husky init
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.html": ["prettier --write"],
    "*.{scss,css,json}": ["prettier --write"]
  }
}
```

Update `.husky/pre-commit`:

```bash
npx lint-staged
```

Now every commit is automatically linted and formatted. No more "you forgot to format this" in code reviews.

## Verify Everything Works

```bash
npm run lint
npm run format:check
```

Both should pass on a clean project. If ESLint and Prettier conflict on something, `eslint-config-prettier` is doing its job — Prettier wins on formatting, ESLint wins on logic.

That's the setup. It takes 10 minutes and saves hours of style debates.
