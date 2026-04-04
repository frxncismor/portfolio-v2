# Skill Registry — portfolio-v3

Generated: 2026-04-04 | Mode: engram | Project: portfolio-v3

## Trigger Table

| Trigger | Skill Name | Path |
|---------|-----------|------|
| "SEO", "audit", "schema", "Core Web Vitals", "sitemap", "E-E-A-T", "technical SEO", "page speed", "structured data" | seo | ~/.claude/skills/seo/SKILL.md |
| "judgment day", "dual review", "adversarial review", "doble review" | judgment-day | ~/.claude/skills/judgment-day/SKILL.md |
| Creating a pull request, opening a PR | branch-pr | ~/.claude/skills/branch-pr/SKILL.md |
| Creating a GitHub issue | issue-creation | ~/.claude/skills/issue-creation/SKILL.md |
| "create a skill", "add agent instructions" | skill-creator | ~/.claude/skills/skill-creator/SKILL.md |

## Compact Rules

### seo
- Always audit: title, description, canonical, OG tags, JSON-LD schema
- Use Astro <Image /> for all images — width, height, alt mandatory
- Font preload links in <head> with font-display: swap
- robots.txt in public/, sitemap via @astrojs/sitemap
- JSON-LD Person schema for portfolio: name, url, sameAs (GitHub)
- Zero CLS: define explicit font fallback stacks before webfonts load
- Lighthouse 100 target: no render-blocking resources, lazy load below fold

### judgment-day
- Launch two blind judge sub-agents simultaneously, never share each other's output
- Synthesize findings and apply fixes before re-judging
- Max 2 iteration rounds before escalating to user
- Judges must review the same target independently

### branch-pr
- Every PR MUST link an approved issue
- Every PR MUST have exactly one type:* label
- Automated checks must pass before merge

### issue-creation
- Issue-first: always create issue before branch/PR
- Include acceptance criteria in issue body
- Label with appropriate type (feat, fix, chore, etc.)

### skill-creator
- Skills live in ~/.claude/skills/{name}/SKILL.md
- Frontmatter: name, description (with Trigger:), license, metadata
- Include: When to Use, Critical Patterns, compact rules section
- Keep compact rules ≤15 lines — they get injected into sub-agent prompts
