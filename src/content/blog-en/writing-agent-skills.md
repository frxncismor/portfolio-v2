---
title: "Writing Agent Skills That Actually Get Used"
description: "How to write a SKILL.md that triggers when it should: the description that decides activation, progressive disclosure, a full example and how to test it."
date: 2027-01-04
category: "AI"
draft: false
---

# Writing Agent Skills That Actually Get Used

**TL;DR:** A skill is a folder with a `SKILL.md` that teaches an agent a repeatable method, and the agent loads it only when the task matches. Most skills fail in one place: the `description`, because that is the only part the agent sees before deciding. Keep the body short, push detail into separate files, test the skill with prompts that should and should not trigger it, and review it like code.

In [What It's Like to Be a Web Developer in 2026](/blog/web-dev-in-2026-with-ai/) I described skills as best practices you encode once. This post is the how-to. Its sibling, [Build Your First MCP Server in TypeScript](/blog/build-your-first-mcp-server-typescript/), covers the other half: MCP gives the agent context and capabilities, a skill gives it a method.

## Skill, Prompt, or CLAUDE.md?

I used to put everything in one big instructions file. It works until the file grows and every task pays for rules it doesn't need. Now I split by *when the information is needed*:

| Where | What goes there | Loaded |
|---|---|---|
| `CLAUDE.md` / `AGENTS.md` | Facts and rules that apply to every task: stack, commands, conventions | Every session |
| Prompt | This task's specifics | One time |
| Skill | A procedure for a recurring kind of task | Only when relevant |

The Claude Code docs say it directly: unlike `CLAUDE.md`, a skill's body loads only when it's used, so long reference material costs almost nothing until needed. My rule: if it's a convention that always applies, it goes in `CLAUDE.md`. If it's a multi-step "how we do X here", it's a skill.

## Anatomy of a Skill

A skill is a directory containing a `SKILL.md`. In Claude Code, project skills live in `.claude/skills/<skill-name>/SKILL.md` (commit them so the team gets them), and personal ones in `~/.claude/skills/<skill-name>/SKILL.md`.

```text
.claude/skills/
└── adding-api-endpoint/
    ├── SKILL.md          # short: when to use it + the steps
    ├── conventions.md    # detail, read only when needed
    └── scripts/
        └── check-endpoint.sh
```

`SKILL.md` has YAML frontmatter followed by Markdown instructions:

```markdown
---
name: adding-api-endpoint
description: Adds a new REST endpoint to the orders API with schema validation and a test. Use when the user asks to add, create or expose an endpoint, route or API operation.
---
```

Two fields matter, and the platform docs set the limits:

- **`name`**: lowercase letters, numbers and hyphens only, up to 64 characters, and it cannot contain the reserved words `anthropic` or `claude`. In Claude Code it also becomes the `/adding-api-endpoint` command, and defaults to the directory name if omitted.
- **`description`**: non-empty, up to 1,024 characters in the general spec. Claude Code truncates the combined `description` and `when_to_use` text at 1,536 characters in its skill listing, so put the key use case first.

Claude Code ignores frontmatter fields it doesn't recognize without reporting an error, and it only reads the frontmatter if the opening `---` is the very first line of the file. A typo in a field name fails silently, which is a good reason to test.

## The Description Is the Product

At startup, only each skill's name and description are loaded. The agent picks a skill from those lines alone, possibly out of dozens. So the description must say **what the skill does and when to use it**, in third person, with the words a user would actually say.

```yaml
# Vague: never triggers reliably
description: Helps with APIs

# I can help you...: wrong point of view
description: I can help you add endpoints

# Specific, third person, with triggers
description: Adds a new REST endpoint to the orders API with schema validation and a test. Use when the user asks to add, create or expose an endpoint, route or API operation.
```

The Anthropic guidance is explicit about point of view: descriptions are injected into the system prompt, and mixing "I" or "you" can cause discovery problems. I also include the synonyms people use ("route", "operation") because the model matches intent, and the more precisely the description names the situation, the fewer false triggers.

## Progressive Disclosure: Short Body, Detail on Demand

There are three levels of loading: metadata always, the `SKILL.md` body when the skill triggers, and extra files only when the instructions point to them. The docs recommend keeping the body under 500 lines, and I aim far lower.

Here is the body of my example skill:

```markdown
# Adding an API endpoint

## Steps

1. Read `src/routes/orders.ts` to see the current pattern. Mirror it.
2. Define request and response schemas next to the route, never inline in the handler.
3. Implement the handler. Business rules go in `src/services/`, not in the route.
4. Add a test in `src/routes/orders.test.ts`: one happy path, one validation failure.
5. Run `scripts/check-endpoint.sh` and fix anything it reports before finishing.

## Details

- Naming, status codes and error shape: see [conventions.md](conventions.md).
```

Notice what it doesn't contain: no explanation of what REST is. The best-practices guide puts it well: the model is already very smart, so only add context it doesn't have. Every paragraph should justify its token cost.

Two more structural rules from the docs: keep references **one level deep** from `SKILL.md` (a file linked from a file linked from `SKILL.md` may only be partially read), and prefer **scripts for deterministic checks**. A script that validates the result is more reliable than asking the model to eyeball it, and its output is all that enters the context. Make clear whether the agent should *run* a script or *read* it.

## Match Freedom to Fragility

The same guide has a useful framing. Give the agent freedom where many approaches work (a code review), and exact instructions where one wrong step is costly (a database migration: "run exactly this command, don't add flags"). Most of my skills mix both: loose guidance for design, rigid steps for the commands that can do damage.

If a skill should only run when I ask for it, because it has side effects, Claude Code supports `disable-model-invocation: true` in the frontmatter, so it is invoked only with `/name`.

## Test It: Should Trigger, Should Not Trigger

I treat a skill like a feature. Before trusting it I write a handful of prompts in two groups:

| Should trigger | Should not trigger |
|---|---|
| "Add a GET /orders/:id endpoint" | "Explain how our orders route works" |
| "Expose a route to cancel an order" | "Rename the orders table" |
| "Create an API operation for refunds" | "Fix the failing orders test" |

Run each in a fresh session and check whether the skill activated. If a "should not" case triggers, the description is too broad. If a "should" case misses, add the words people used. You can also run `/adding-api-endpoint` directly to confirm the body itself works.

The docs recommend building evaluations before writing lots of documentation: run the agent on representative tasks without the skill, note exactly where it fails, write the minimum instructions that fix those gaps, then compare. Also test with the models you actually use, since a skill that works with a larger model may need more detail for a smaller one.

## Keep It Alive

Skills rot like any documentation. Mine live in the repo under `.claude/skills/`, so changes go through pull requests and review. When the agent makes the same mistake twice, I don't repeat the correction in chat: I add a line to the skill. When a rule stops being true, I delete it. And I avoid time-sensitive phrasing like "before March, use the old API"; keep an "old patterns" section instead.

## Key Takeaways

- Put always-true rules in `CLAUDE.md`, one-off details in the prompt, and recurring procedures in skills.
- The `description` decides activation: say what the skill does and when to use it, in third person, with real trigger words.
- Keep `SKILL.md` short, link detail one level deep, and use scripts for checks.
- Test with prompts that should trigger the skill and prompts that should not.
- Version skills in the repo and review changes like code.

## Further Reading

- [Extend Claude with skills (Claude Code docs)](https://code.claude.com/docs/en/skills)
- [Skill authoring best practices (Anthropic)](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Agent Skills overview (Anthropic)](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
