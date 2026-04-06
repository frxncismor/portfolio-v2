# Code Review Rules

## General
- Use TypeScript everywhere — no implicit `any`
- Prefer `const` over `let`; never use `var`
- No unused variables or imports

## Astro
- Components in `src/components/`, pages in `src/pages/`
- Use Astro props interface with explicit types
- Keep frontmatter logic minimal — data stays in `src/data/`

## CSS / Tailwind
- Use design tokens from `tailwind.config.mjs` — no hardcoded colors in class names
- Inline `style` only for dynamic accent colors passed as props
- Follow existing spacing scale: `p-8`, `gap-6`, `py-32`, `mb-20`

## Naming
- Component files: PascalCase (e.g., `TemplateCard.astro`)
- Data files: camelCase (e.g., `templates.ts`)
- CSS classes: follow existing patterns (`fade-in`, `stagger-group`, `section-label`)

## Commits
- Conventional commits: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`
- No AI attribution in commit messages
