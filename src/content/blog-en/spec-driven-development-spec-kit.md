---
title: "Spec-Driven Development with Spec Kit"
description: "How I use GitHub's Spec Kit to turn a vague request into a spec, a plan and small tasks before an agent writes code, and where the flow breaks."
date: 2027-02-01
category: "AI"
draft: false
---

# Spec-Driven Development with Spec Kit: Spec, Plan, Tasks

**TL;DR:** Coding agents implement what they understood, not what you meant. Spec Kit forces three written checkpoints (spec, plan, tasks) before any code exists, plus a constitution of rules the agent does not negotiate. It pays off on features that touch several files and costs more than it returns on a one-line fix.

## The problem: the agent builds what it understood

You write "add a way to cancel an order" and the agent returns something plausible. It picked a status name, decided refunds are out of scope and skipped the case where the order already shipped. None of that was your decision, and you find out in review.

In [What It's Like to Be a Web Developer in 2026](/blog/web-dev-in-2026-with-ai/) I described a loop where I define the spec and the agent implements. That post gives spec-first one section. This one is the practical version using [Spec Kit](https://github.com/github/spec-kit), GitHub's open-source toolkit for the workflow.

## The flow and what each phase produces

Spec Kit ships a CLI, `specify`, which sets up a project, and a set of slash commands (skills) that you run inside your coding agent. I verified the current names against the README and quickstart: they are written with a hyphen, `/speckit-*`. Older material uses a dot form (`/speckit.specify`), so check which one your installed version exposes.

Install and initialize:

```bash
uv tool install specify-cli
specify init orders-demo --integration copilot
cd orders-demo
```

`--integration` picks the agent. If you omit it, `init` asks you to choose one. I use Claude Code, so I pick that integration; the docs use Copilot in their examples and list the other keys on the integrations index.

The commands, in order:

| Command | Purpose | Output |
|---|---|---|
| `/speckit-constitution` | Project principles, once per project | Constitution file |
| `/speckit-specify` | What to build and why, no tech stack | `spec.md` |
| `/speckit-clarify` | Questions about underspecified areas, folded into the spec | Updated `spec.md` |
| `/speckit-plan` | How to build it with your stack | `plan.md` |
| `/speckit-tasks` | Ordered, small work items | `tasks.md` |
| `/speckit-analyze` | Read-only consistency check across the three files | Report |
| `/speckit-implement` | Execute the tasks | Code |
| `/speckit-converge` | Compare code against spec, plan and tasks, append what is missing | New tasks |

`/speckit-checklist` also exists: it generates a "unit tests for your requirements" checklist that a human reviews. A checked item does not mean the code is done.

The spec describes behavior and constraints. The plan is where the technology choices live. Keeping them apart is the point: if the spec already says "PostgreSQL table", you have skipped the step where you could disagree.

## An example, end to end

The request, with an invented domain: customers should be able to cancel an order.

```text
/speckit-specify Customers can cancel an order while it is still pending or
paid. Shipped orders cannot be cancelled. A paid order cancellation triggers a
refund request. Show the customer a clear reason when cancellation is refused.
```

The agent writes a `spec.md` with user stories and acceptance scenarios. Then I run `/speckit-clarify`, and this is where the value shows up. It asks things like: can a customer cancel an order that has a partially shipped item? Is the refund automatic or does support approve it? I answer, and the answers are written back into the spec instead of living in a chat I will lose.

Next the plan:

```text
/speckit-plan Angular 21 frontend, Fastify API, PostgreSQL with Drizzle.
Cancellation is a state transition on the existing orders table.
```

This produces `plan.md` and, depending on the version, supporting files such as a data model, contracts and a quickstart. Then `/speckit-tasks` splits the plan into an ordered list:

```text
T001 Add `cancelled_at` and `cancel_reason` columns (migration)
T002 Add `cancelOrder(orderId)` domain function with status rules
T003 Test: shipped order is refused with reason `ALREADY_SHIPPED`
T004 POST /orders/:id/cancel route
T005 Cancel button and refusal message in the order detail page
```

Before `/speckit-implement`, I run `/speckit-analyze`. It is read-only and reports conflicts between the three documents, for example a task that no requirement asks for, or a requirement with no task. Fixing that costs minutes; fixing it after implementation costs a review cycle.

After implementation, `/speckit-converge` checks the code against the documents and appends any unbuilt work as new tasks. The README says to repeat implement and converge until it reports `Converged`.

One practical note on layout: the generated directory structure has changed between Spec Kit versions (older docs describe `specs/<branch-name>/` containing `spec.md`, `plan.md`, `tasks.md` and extras; the quickstart now tracks the active feature in `.specify/feature.json`). Run `specify init` in a scratch directory and look, rather than trusting a blog post, including this one.

## The constitution: rules the agent does not negotiate

The constitution is written once per project with `/speckit-constitution`, and every later phase is supposed to respect it. It is the right place for decisions you would otherwise repeat in every prompt. Mine for a TypeScript project looks like this:

```text
/speckit-constitution Principles: strict TypeScript with no implicit any;
every behavior change ships with a Vitest test written first; no new
dependency without a line in the plan explaining why; database changes only
through Drizzle migrations; keep functions small and name them after the
domain.
```

Spec Kit's own methodology document describes constitutional articles such as test-first and simplicity, for example a cap on how many projects a first implementation may create. You do not have to adopt them. Write only rules you will enforce, because a constitution full of aspirations teaches the agent that the rules are optional.

## Where the flow goes wrong

**Specs that inflate.** Left alone, an agent will turn a two-line request into twelve user stories with edge cases nobody asked for. I cut the spec before planning. If a scenario would not change a decision, it goes.

**Tasks that are too big.** "Implement cancellation" is not a task. A good task fits one commit and one test run. When a task touches more than a few files, I split it and rerun `/speckit-analyze`.

**Plan drift.** The agent finds the plan inconvenient during implementation and quietly deviates. `/speckit-converge` catches missing work, but I still read the diff against `plan.md`.

**Clarify skipped.** The questions feel like friction, so people skip them. That is the phase that removes the most rework.

**Documents nobody reads.** If you accept the output without reading it, you have added ceremony without gaining control. The checkpoints only work if you actually review them.

## When not to use it

For a typo, a dependency bump, a renamed variable or a small bug with an obvious cause, writing a spec costs more than the change. My rule of thumb: if I can describe the whole change and its tests in two sentences, I skip Spec Kit. If I would otherwise start a long conversation with the agent, I start with `/speckit-specify` instead.

## Key Takeaways

- Spec Kit makes three decisions explicit and reviewable before code: what (spec), how (plan), in what order (tasks).
- Slash commands are `/speckit-*` in the current docs; confirm the form your installed version uses.
- `/speckit-clarify` and `/speckit-analyze` are the cheapest places to catch mistakes.
- Write a short constitution of rules you will enforce, once per project.
- Cut inflated specs and oversized tasks; skip the whole flow for trivial changes.

## Further Reading

- [github/spec-kit](https://github.com/github/spec-kit): repository and README
- [Spec Kit quickstart](https://github.github.io/spec-kit/quickstart.html): install, `specify init` and the command sequence
- [Spec-driven development methodology](https://github.com/github/spec-kit/blob/main/spec-driven.md): the reasoning and the constitutional articles
- [What It's Like to Be a Web Developer in 2026](/blog/web-dev-in-2026-with-ai/): how this fits into my daily workflow
