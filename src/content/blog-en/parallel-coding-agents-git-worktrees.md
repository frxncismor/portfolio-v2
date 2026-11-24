---
title: "Parallel Coding Agents with Git Worktrees"
description: "One worktree and one branch per agent, an integration branch, --no-ff merges, a sane parallelism ceiling and cleanup. The git pattern, step by step."
date: 2027-02-22
category: "AI"
cover: "worktrees"
draft: false
---

# Running Coding Agents in Parallel with Git Worktrees

**TL;DR:** Two agents editing the same checkout will overwrite each other. Give each agent its own git worktree on its own branch, merge their work into an integration branch with `--no-ff`, keep the number of agents low enough for your RAM and your review capacity, and remove the worktrees when you finish.

## Why one checkout is not enough

I described my day-to-day setup in [What It's Like to Be a Web Developer in 2026](/blog/web-dev-in-2026-with-ai/): the agent implements, I review. The next step is obvious. If one agent is useful, three agents working on three independent tasks should be faster.

They are, as long as they do not share a working directory. In one checkout, agent A's half-finished edit breaks agent B's test run, `git status` shows a mix of both, and a `git checkout` by one silently changes the files under the other. You cannot tell whose change is whose.

A [git worktree](https://git-scm.com/docs/git-worktree) fixes this without cloning the repository three times. Each linked worktree has its own files, `HEAD` and index, while sharing the repository history and every ref under `refs/`.

## The git commands

Everything below is standard git. I checked each one against the [git-worktree manual](https://git-scm.com/docs/git-worktree).

```bash
# Create a worktree at ../shop-orders-api on a new branch, starting from HEAD
git worktree add -b feat/orders-api ../shop-orders-api

# Same, but start from a specific base
git worktree add -b feat/orders-ui ../shop-orders-ui integration/orders

# See what exists
git worktree list

# Remove a clean worktree
git worktree remove ../shop-orders-api

# Forget metadata for worktree directories deleted by hand
git worktree prune --dry-run
git worktree prune
```

Facts that matter in practice:

- `-b <branch>` creates a new branch and checks it out in the new worktree; it refuses if the branch already exists (`-B` resets it instead, so use it carefully).
- By default, `add` refuses to check out a branch that another worktree already has. One branch, one worktree. This is a feature: it stops two agents from sharing a branch.
- `git worktree remove` only removes clean worktrees (no untracked files, no changes to tracked files). `--force` overrides that and throws away uncommitted work.
- `git worktree list` marks a worktree as `prunable` when its directory is gone, and `git worktree prune` cleans that metadata. Prefer `remove` over deleting folders manually.
- If a worktree lives on a drive that is not always mounted, `git worktree lock` keeps it from being pruned.

## The pattern

I use one branch per agent plus one integration branch.

```text
main
 └─ integration/orders        <- where finished work lands
     ├─ feat/orders-api       <- agent 1, worktree ../shop-orders-api
     ├─ feat/orders-ui        <- agent 2, worktree ../shop-orders-ui
     └─ test/orders-e2e       <- agent 3, worktree ../shop-orders-e2e
```

Setup:

```bash
git switch -c integration/orders main

git worktree add -b feat/orders-api  ../shop-orders-api  integration/orders
git worktree add -b feat/orders-ui   ../shop-orders-ui   integration/orders
git worktree add -b test/orders-e2e  ../shop-orders-e2e  integration/orders
```

Each agent starts in its own directory. In a fresh worktree the dependencies are not installed (`node_modules` is untracked), so run your install step there first. Tell each agent which paths it owns; the cleanest split is by area of the code, not by layer of the same file.

When an agent finishes and I have reviewed its diff, I merge it into the integration branch:

```bash
git switch integration/orders
git merge --no-ff feat/orders-api -m "feat(orders): add cancel endpoint"
```

I use `--no-ff` on purpose. It records a merge commit even when a fast-forward is possible, so the history shows which agent's work arrived when, and reverting one agent's contribution is a single `git revert -m 1 <merge>`. Agent branches are short-lived, so the extra merge commits cost nothing.

Run the full test suite on `integration/orders` after each merge, not only in the agent's worktree. Two branches can pass their tests alone and still conflict in behavior.

When the integration branch is green, it goes to `main` through a pull request like any other change.

## How many agents at once

More agents is not better past a point, and the ceiling has two causes.

**Machine resources.** Every worktree is a full checkout with its own `node_modules`, its own dev server, its own test runner and its own agent process. An Angular build plus a Vitest watcher plus a Playwright browser per worktree adds up quickly. Check free RAM before launching another agent, start with two or three, and add more only while builds and test runs stay fast. If the machine starts swapping, you have gone past the ceiling.

**Your review capacity.** Each agent produces a diff you have to read. If you cannot review as fast as they produce, the queue just moves to you, and unreviewed work is where regressions come from. In practice the real bottleneck is usually your ability to review, not the hardware, so size the number of agents to what you can read carefully.

Shared resources also collide even when files do not: two dev servers on the same port, two test runs against the same local database. Give each worktree its own port and database name through an untracked `.env`, or the isolation is only half there.

## Conflicts

Worktrees prevent edit-time collisions; they do not prevent merge-time conflicts. Two agents that both touch `package.json`, a router file or a shared type will conflict when you merge the second one.

What helps:

- Split tasks along file boundaries before you start, and say so in each agent's instructions.
- Put the shared change (a new type, a dependency) in the integration branch first, then branch the agents from it.
- Merge small and often. Merge agent branches as each one finishes instead of at the end of the day.
- If a conflict appears, resolve it on the integration branch, not in an agent's worktree, and rerun the tests.
- After merging one agent, rebase or merge the integration branch into the agents still working if they depend on the change.

## Claude Code and worktrees

Claude Code supports this natively. `claude --worktree <name>` creates a worktree under `.claude/worktrees/<name>/` on a new branch named `worktree-<name>` and starts a session in it. By default it branches from the repository's default branch, and a setting (`worktree.baseRef`) can switch it to your current `HEAD`. Custom subagents can also declare `isolation: worktree` in their frontmatter. You can add a `.worktreeinclude` file to copy gitignored files such as `.env` into each new worktree. See the [Claude Code worktree docs](https://code.claude.com/docs/en/worktrees.md) for the exact behavior.

The built-in command is convenient for independent sessions. I still use plain `git worktree add` when I want a specific base branch (the integration branch, for example) or a worktree outside the repository folder, which the docs also describe as the case for manual management.

## Cleaning up

Worktrees pile up. When the work is merged:

```bash
git worktree remove ../shop-orders-api
git branch -d feat/orders-api
git worktree list
git worktree prune
```

`git branch -d` only deletes a branch that is merged, which is a free safety check. If `remove` refuses because the worktree is unclean, read what is left before reaching for `--force`; that is either work you forgot to commit or files you can safely lose.

For worktrees Claude Code created, it removes clean ones when an unnamed session exits and prompts you if there is work in them; non-interactive runs are not cleaned up automatically, so remove them yourself.

## Key Takeaways

- One agent, one worktree, one branch; git itself refuses to check out the same branch twice.
- Branch agents from an integration branch and merge them back with `--no-ff` so each contribution is visible and revertable.
- Parallelism is limited by RAM and by how fast you can review, not by how many terminals you can open.
- Isolate ports and databases too; files are only part of the sharing.
- Remove worktrees with `git worktree remove`, delete merged branches, and prune stale metadata.

## Further Reading

- [git-worktree manual](https://git-scm.com/docs/git-worktree): `add`, `list`, `remove`, `prune`, `lock`
- [Claude Code: run parallel sessions with worktrees](https://code.claude.com/docs/en/worktrees.md): `--worktree`, subagent isolation and cleanup
- [What It's Like to Be a Web Developer in 2026](/blog/web-dev-in-2026-with-ai/): the workflow this builds on
