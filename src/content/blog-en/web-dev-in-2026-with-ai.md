---
title: "What It's Like to Be a Web Developer in 2026"
description: "The tools changed. The fundamentals didn't. Here's how I actually work in 2026 using Claude Code, MCPs, skills, and the Gentle AI stack."
date: 2026-04-04
category: "AI"
draft: false
---

# What It's Like to Be a Web Developer in 2026

People keep asking if AI replaced developers. It didn't. What it replaced is the excuse for not understanding your craft. Let me tell you what my actual workflow looks like now.

## The Mental Model That Everything Else Depends On

AI is a tool. You are the architect.

If you don't know what the DOM is, you can't evaluate what the AI wrote. If you don't understand change detection, you can't tell when the generated Angular component is wrong. The gap between a developer who uses AI and a developer who *understands* AI output is exactly the gap between someone who knows their fundamentals and someone who doesn't.

AI amplifies what you already are. That's the double-edged part.

## Claude Code: Not a Chatbot, a Collaborator

I work with Claude Code as a sub-agent system. The model doesn't write code at me — it works *with* me inside a structured workflow. I define the architecture. I define the spec. Claude implements, I review and steer.

The key difference from "AI chatbot writes code" is **agency**. I know what I'm asking for and why. When Claude takes a wrong turn, I catch it because I understand what correct looks like.

```bash
# This is my actual terminal most of the day
claude code
```

That's it. The intelligence is in the configuration, not the command.

## MCP Servers: Giving the Agent Real Context

MCP (Model Context Protocol) is what makes modern AI tooling actually useful. Instead of describing your project to the AI in every message, MCP servers inject live context: your Notion docs, your database schema, your design files, your git history.

I run several MCPs in my stack:

- **Engram** — persistent memory across sessions. The agent remembers what we decided last week.
- **Firebase** — read/write access to the project database
- **Playwright** — browser automation for testing and visual verification
- **Notion** — pulls in project docs and specs automatically
- **Pencil** — reads and writes design files

The result: the agent knows the codebase, the history, the design, and the spec before I type a single word.

## Skills: Encoding Best Practices Once, Using Them Always

Skills are reusable agent behaviors. Think of them as a codified senior developer opinion that gets injected into every relevant task.

When I'm building an Angular component, the `angular-best-practices` skill fires automatically. It tells the agent: use signals for state, standalone components only, no ViewChild when signals work, reactive forms over template-driven.

I wrote those rules once. They run on every Angular task, forever. Zero repetition. Zero "but you did it differently last time."

The [Gentle AI](https://github.com/Gentleman-Programming/gentle-ai) stack ships a full catalog of skills across Angular, Go, React, testing, SDD, and more. One install command and your agent is opinionated about your stack.

## Context Window: The Most Misunderstood Constraint

The context window is how much the model can "see" at once. Most people hit its limit and get confused when the agent "forgets" what you talked about an hour ago.

The solution isn't a bigger model — it's **memory architecture**.

I use Engram (a persistent memory MCP) to save decisions, discoveries, and conventions *as they happen*. When a session starts, the agent loads the relevant memories first. When context fills up, the important stuff is already persisted. Nothing is lost.

```
Session 1: Decide on auth architecture → saved to Engram
Session 2: Agent loads auth decision from Engram before writing auth code
```

This is the difference between an agent that builds incrementally and one that reinvents the wheel every session.

## RAG: Retrieval Augmented Generation

RAG is how you give an AI access to knowledge it wasn't trained on — your private docs, your company's code standards, the spec you wrote yesterday.

In practice: instead of stuffing an entire codebase into the context window, you store it in a searchable format (Engram, a vector DB, etc.) and retrieve only the relevant chunks when needed.

For development, this means: write the spec once, and the agent retrieves it automatically when implementing. Write the architecture decision once, and it's always available without eating your context budget.

## Fine-Tuning vs Prompting: When to Use Which

People reach for fine-tuning when they should use better prompting — and vice versa.

**Use prompting (skills/system prompt) when:**
- You want the model to follow specific conventions
- The behavior should adapt to context
- You're working on your own projects or client work

**Use fine-tuning when:**
- You have thousands of examples of correct input/output pairs
- You need the model to internalize a very specific domain
- The behavior is fixed and doesn't need to adapt

For 95% of development workflows, skills + RAG + structured prompting outperforms fine-tuning. Fine-tuning is expensive, slow to iterate on, and overkill for most use cases.

## The Gentle AI Stack in Practice

The [Gentle AI stack](https://github.com/Gentleman-Programming/gentle-ai) is what ties all of this together. One install command configures:

- **8 supported agents** (Claude Code, Cursor, VS Code Copilot, etc.)
- **Engram** for persistent memory
- **SDD** (Spec-Driven Development) workflow: explore → propose → spec → design → tasks → apply → verify
- **Skills catalog** across multiple languages and frameworks
- **Persona** — a senior architect persona that teaches while it works
- **Per-phase model routing** — Opus for architecture decisions, Sonnet for implementation

The workflow isn't "ask AI to write a feature." It's:

1. **Explore** — agent reads the codebase and maps the problem
2. **Propose** — architectural approach documented
3. **Spec** — requirements written as Given/When/Then scenarios
4. **Design** — file changes, interfaces, and decisions documented
5. **Tasks** — concrete checklist
6. **Apply** — implementation against the spec
7. **Verify** — check that what was built matches what was specified

Every step is saved to Engram. Every session picks up exactly where the last one ended.

## The Bottom Line

2026 development isn't "prompt and pray." It's:

- Foundations still matter — more than ever
- AI amplifies your understanding, not replaces it
- Memory, skills, and structured workflows turn a chatbot into a system
- The developers winning right now understand their tools at both levels: the AI layer and the code underneath it

The tools changed. The craft didn't. You still have to know what you're building.
