---
title: "Tests as a Contract: Stop AI Rewriting Your Tests"
description: "Stop coding agents from weakening your tests: Claude Code deny rules and a PreToolUse hook, CODEOWNERS, and a GitHub Actions guard that inspects the PR diff."
date: 2027-01-18
category: "Testing"
cover: "contract"
draft: false
---

# Tests as a Contract: Stop AI From Rewriting Your Tests

**TL;DR:** A coding agent that is told "make the tests pass" has two ways to do it: fix the code, or change the tests. The second one is often cheaper, so sometimes it takes it. The fix is not a better prompt. It is to make tests a contract the agent can read but cannot edit: `deny` rules and a `PreToolUse` hook in Claude Code, `CODEOWNERS` with required review, and a CI check that inspects the PR diff. This post shows each layer with working config.

## The Failure Mode

I first noticed it on a boring task. A test for an `applyDiscount` function was failing after a refactor. The agent came back with "all tests pass". They did, because it had changed `expect(total).toBe(90)` to `expect(total).toBeGreaterThan(0)`.

It is not malice. The agent optimizes for the goal you gave it, and a green run is the easiest thing to measure. In practice it shows up as:

- Weakened assertions: exact values become `toBeDefined()` or `toBeTruthy()`.
- Disabled tests: `it.skip`, `it.todo`, or a test deleted outright.
- Narrowed tests: `it.only` left in, so the rest of the file silently stops running.
- Regenerated snapshots: `vitest -u` run to make a diff disappear instead of understanding it.
- Edited fixtures: the expected data changed to match the new (wrong) output.

If you work with agents daily, as I described in [What It's Like to Be a Web Developer in 2026](/blog/web-dev-in-2026-with-ai/), you will see at least one of these. The question is whether your setup catches it.

## The Principle: Two Roles, One Direction of Trust

Tests encode what the code must do. The implementation is whatever satisfies them. If one actor writes both and is rewarded for green, the tests stop being a check.

So I separate the roles:

- **A human, or an agent in a separate session with a different task, writes or approves the tests.** They define the contract.
- **The implementing agent can read the tests and run them, but not edit them.** If a test looks wrong, it stops and says so.

Everything below enforces that, from soft to hard. No single layer is enough, so I use all of them.

## Layer 1: Deny Rules in Claude Code

Claude Code evaluates permission rules in the order deny, then ask, then allow, and the first match wins, so an allow rule cannot carve an exception out of a deny. Put the deny rules in `.claude/settings.json` so they are checked into the repo:

```json
{
  "permissions": {
    "deny": [
      "Edit(**/*.test.ts)",
      "Edit(**/*.spec.ts)",
      "Edit(tests/**)",
      "Edit(**/__snapshots__/**)"
    ]
  }
}
```

Two details from the permissions docs matter here. First, `Edit` rules apply to all built-in tools that edit files, so you do not write a separate `Write(...)` rule. In fact, the docs say a `Write(docs/**)` pattern is not matched: use `Edit`. Second, a deny pattern like `Edit(tests/**)` without a leading `/` matches a `tests` directory at any depth under the current directory.

The limit: these rules cover Claude's file tools and the Bash commands Claude Code can analyze (redirects and commands like `sed` or `tee`). The docs are explicit that a Bash rule is not a security boundary, because the same effect can be reached through other invocations. That is why there is a second layer.

## Layer 2: A PreToolUse Hook That Says Why

A deny rule blocks. A hook can also explain, which matters because the agent reads the message and changes course. This is the config:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PROJECT_DIR}/.claude/hooks/protect-tests.mjs\""
          }
        ]
      }
    ]
  }
}
```

The `matcher` accepts exact tool names separated by `|`, so `Edit|Write` matches those two tools. Claude Code sends the event as JSON on stdin, and for these tools the path is in `tool_input.file_path`. A script that blocks test paths:

```js
// .claude/hooks/protect-tests.mjs
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const file = String(input.tool_input?.file_path ?? "").replaceAll("\\", "/");

const isTestPath =
  /\.(test|spec)\.[cm]?[jt]sx?$/.test(file) ||
  /\.snap$/.test(file) ||
  /\/(tests|__snapshots__)\//.test(file);

if (isTestPath) {
  console.error(
    `Blocked: ${file} is part of the test contract. ` +
      "Do not edit tests. Fix the implementation, or stop and tell me why the test is wrong.",
  );
  process.exit(2); // exit code 2 = blocking error; stderr goes back to Claude
}

process.exit(0); // no decision: normal permission flow continues
```

Per the hooks docs, exit code 2 blocks the call and the hook's stderr is the message Claude sees. If you prefer structured output, exit 0 and print a single JSON object instead:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Test files are read-only for the implementing agent."
  }
}
```

The JSON is only read on exit 0, and stdout should contain nothing else. I use the exit-2 form because it is shorter. Note that `exit 0` here means "no opinion", not "allow": the normal permission flow still applies.

Keep the hook small. It runs on every edit, so it must be fast and deterministic. No network, no model calls.

## Layer 3: CODEOWNERS Plus Required Review

Local guards depend on the agent running inside your configuration. The repository must not. `CODEOWNERS` puts a human on every change to the contract. GitHub looks for the file in `.github/`, the repo root, or `docs/`:

```text
# .github/CODEOWNERS
# The last matching pattern takes precedence.

*                          @acme/developers
*.test.ts                  @acme/qa
*.spec.ts                  @acme/qa
/tests/                    @acme/qa
**/__snapshots__/          @acme/qa
```

Owners need write access, and a `CODEOWNERS` file alone only requests reviews automatically. To make approval mandatory you need to turn on **Require review from Code Owners** in a branch protection rule (or use a ruleset). Without that setting, the file is a suggestion.

## Layer 4: A CI Guard That Reads the Diff

The last layer runs on the PR itself, so it also catches changes made by hand, by another tool, or through a Bash command the local rules did not recognize. The workflow runs on `pull_request`, whose default activity types are `opened`, `synchronize` and `reopened`. I add `labeled` and `unlabeled` so a human can acknowledge an intentional contract change:

```yaml
# .github/workflows/test-contract.yml
name: test-contract
on:
  pull_request:
    types: [opened, synchronize, reopened, labeled, unlabeled]

permissions:
  contents: read

jobs:
  guard:
    runs-on: ubuntu-latest
    if: ${{ !contains(github.event.pull_request.labels.*.name, 'contract-change') }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # full history, so the base branch is available to diff

      - name: Inspect the diff
        env:
          BASE_REF: ${{ github.base_ref }}
        run: |
          set -euo pipefail
          range="origin/${BASE_REF}...HEAD"
          tests='(\.(test|spec)\.[cm]?[jt]sx?$|^tests/|__snapshots__/|\.snap$)'

          changed=$(git diff --name-only "$range")
          test_files=$(printf '%s\n' "$changed" | grep -E "$tests" || true)
          src_files=$(printf '%s\n' "$changed" | grep -E '^src/' | grep -Ev "$tests" || true)

          if [ -z "$test_files" ]; then
            echo "No test files changed."
            exit 0
          fi

          if [ -n "$src_files" ]; then
            echo "::error::This PR changes tests and source together. Split it or add the 'contract-change' label."
            exit 1
          fi

          # Added lines that skip or narrow tests
          bad=$(git diff -U0 "$range" -- $test_files \
            | grep -E '^\+[^+]' \
            | grep -cE '\.(only|skip|todo)\(|\b(xit|xdescribe|xtest)\(' || true)
          if [ "$bad" -gt 0 ]; then
            echo "::error::Found $bad added line(s) with .only/.skip/.todo."
            exit 1
          fi

          # Fewer assertions than before
          removed=$(git diff -U0 "$range" -- $test_files | grep -E '^-[^-]' | grep -c 'expect(' || true)
          added=$(git diff -U0 "$range" -- $test_files | grep -E '^\+[^+]' | grep -c 'expect(' || true)
          if [ "$removed" -gt "$added" ]; then
            echo "::error::Assertions dropped: -$removed +$added."
            exit 1
          fi
```

Notes on this script:

- `fetch-depth: 0` is needed because the default checkout fetches a single commit, and the three-dot diff needs the base branch.
- It is a heuristic. Counting `expect(` will not catch a weakened matcher on the same line, and a refactor can legitimately move assertions around. That is what the `contract-change` label is for: a person decides, and the decision is visible in the PR.
- Vitest already helps. `allowOnly` defaults to `!process.env.CI`, so `.only` fails the run in CI, and Vitest does not write snapshots in CI: a missing or mismatched snapshot fails instead of being created.

Then make this check required in branch protection, otherwise it is only a red mark.

## Snapshots and Golden Files Need a Human

Snapshots are the easiest escape hatch, because regenerating them is a documented command (`vitest -u`). Treat a snapshot diff like a code diff. In the PR, read it. If a snapshot changed and the PR description cannot say why, the change is not ready. Snapshot and golden directories are already in the deny rules, the hook, and CODEOWNERS above, so an agent cannot refresh them quietly.

## Intent Comments: Tell the Next Reader Why

The last layer is for the model that reads the tests before touching code. A test with only an exact value invites "adjusting" it. A test that states its intent resists it:

```ts
import { describe, expect, it } from "vitest";
import { applyDiscount } from "./discount";

describe("applyDiscount", () => {
  it("never produces a negative total", () => {
    // CONTRACT: a discount larger than the order total clamps to 0.
    // Finance relies on this. If this fails, fix applyDiscount, not the test.
    expect(applyDiscount({ total: 50, percent: 120 })).toBe(0);
  });
});
```

This does not enforce anything. It improves the odds that an agent (or a tired human) treats the failure as information about the code.

## What I Do When a Test Really Is Wrong

Tests do have bugs. The rule is that the implementing agent does not fix them. It reports the test, the failure, and why it believes the test is wrong, and then a human or a separate session changes it. That change goes through the same PR review as code, and the `contract-change` label records that it was deliberate.

To check that the contract is strong enough in the first place, use mutation testing and property-based tests. I cover that in [Adversarial Testing with AI Agents](/blog/adversarial-testing-with-ai-agents/).

## Key Takeaways

- Agents fail tests the cheap way sometimes: weaker assertions, `.skip`, regenerated snapshots, edited fixtures. Assume it will happen.
- Separate who writes the tests from who implements, and make tests read-only for the implementing agent.
- Use `permissions.deny` with `Edit(...)` patterns, a `PreToolUse` hook with matcher `Edit|Write` that exits with code 2 and a clear message, and remember Bash is not a hard boundary.
- `CODEOWNERS` only enforces anything when "Require review from Code Owners" is on in branch protection or a ruleset.
- A CI guard on the PR diff is the layer that does not depend on the agent's configuration. Make it required, and give humans a visible way to approve intentional changes.
- Snapshots are tests: review their diffs, and never let them be regenerated silently.

## Further Reading

- [Hooks reference (Claude Code)](https://code.claude.com/docs/en/hooks)
- [Configure permissions (Claude Code)](https://code.claude.com/docs/en/permissions)
- [About code owners (GitHub Docs)](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Events that trigger workflows: pull_request (GitHub Docs)](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows)
- [Snapshot testing (Vitest)](https://vitest.dev/guide/snapshot)
- [allowOnly (Vitest)](https://vitest.dev/config/allowonly)
