---
title: How to Set Up ESLint and Prettier in Your Angular Projects ✨
date: 2025-12-04
description: Learn how to level up your Angular projects with a clean, consistent and professional codebase. 💻✨ In these posts, I walk you through setting up ESLint and Prettier in Angular, leveraging Angular’s own migrations, and combining linting, formatting and accessibility best practices so your team can focus on shipping features—not arguing about code style.
tags: [Angular, JavaScript, Web Development, Software Development, ESLint, Prettier]
slug: how-to-setup-eslint-and-prettier-in-angular-20-projects
author: Francisco Moreno
imageUrl: https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=1206&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
---

# How to Set Up ESLint and Prettier in Your Angular Projects ✨

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
