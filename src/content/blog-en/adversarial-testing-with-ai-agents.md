---
title: "Adversarial Testing with AI Agents: One Builds, One Breaks"
description: "Use one AI agent to build and another to break it: a breaker with only the spec, fast-check properties, and Stryker mutation score instead of coverage."
date: 2027-02-15
category: "Testing"
draft: false
---

# Adversarial Testing with AI Agents: One Builds, One Breaks

**TL;DR:** An agent that writes code and then writes its tests shares one set of blind spots, so the tests pass for the same reasons the code works. Give the breaking job to a separate agent that sees only the spec and the public interface, have it express attacks as properties with fast-check instead of hand-picked examples, and measure whether your tests catch bugs with Stryker's mutation score instead of coverage. A human decides which attacks become permanent tests.

## Why the Builder Cannot Test Its Own Work

When the same agent implements a function and writes its tests, the tests mirror the implementation. If it forgot that a discount can exceed the order total, it also forgot to test that. Line coverage reports 100% and nothing was checked.

Humans have the same problem, which is why QA exists. With agents the fix is cheap: start a second session with a different job and a different view of the world. This pairs with the other half of the story, keeping the resulting tests safe from the builder, which I covered in [Tests as a Contract](/blog/tests-as-a-contract-ai/).

## The Breaker Role

The breaker has one goal: find an input where the implementation violates the spec. What makes it useful is what it does **not** see.

- It gets the written spec and the exported types or function signatures.
- It does not get the implementation source. If it reads the code, it starts reasoning about how the code works and stops reasoning about what the code should do.
- It can run the code and write new test files, in its own worktree or branch. It cannot change the implementation.

A prompt shape that works:

```text
You are a breaker. You did not write this code and you cannot read it.

Spec: <paste the spec>
Public interface: <paste the signatures and types>

Find inputs where the behavior violates the spec. Prioritize:
1. Boundary values (0, 1, max, empty, just past each limit)
2. Hostile input (negative numbers, NaN, huge strings, duplicates, unicode)
3. Invariants that must hold for ALL valid inputs

Write each finding as a Vitest test or a fast-check property.
For every test, say which spec line it attacks. Do not edit src/.
```

The last instruction matters: tying each attack to a spec line lets me filter fast. A test that attacks something the spec never promised is noise, or a hole in the spec.

## Properties Instead of Examples

Asking an agent for 20 edge cases gives you 20 examples it thought of. A property says "for any valid input, this is always true", and the library generates inputs, including ones nobody would write by hand. With fast-check, an arbitrary generates values in a seeded way and shrinks a failing one to a small counterexample.

Here is a function and the properties a breaker would write from the spec "the discounted total is never negative and never higher than the original":

```ts
// src/orders/discount.ts
export function applyDiscount(total: number, percent: number): number {
  return Math.round(total * (1 - percent / 100) * 100) / 100;
}
```

```ts
// tests/orders/discount.property.test.ts
import { describe, it } from "vitest";
import fc from "fast-check";
import { applyDiscount } from "../../src/orders/discount";

describe("applyDiscount properties", () => {
  it("never returns a negative total", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 200 }),
        (total, percent) => applyDiscount(total, percent) >= 0,
      ),
    );
  });

  it("never returns more than the original total", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 100 }),
        (total, percent) => applyDiscount(total, percent) <= total,
      ),
    );
  });
});
```

The first property fails immediately: with `percent` above 100 the result goes negative. fast-check shrinks the failure to a minimal case and prints a counterexample, along with a seed. The `fc.assert` parameters include `numRuns` (100 by default), and `seed` plus `path` to replay a specific failing run, which is how you turn a flaky-looking discovery into a reproducible test:

```ts
fc.assert(property, { seed: 1234567890, path: "42:3", numRuns: 500 });
```

Use the seed and path printed in your own failure message, not these values. Once the bug is understood and fixed, I keep the property and add the shrunk counterexample as a plain example test, so the regression is pinned even if generation changes.

For async code, the equivalent is `fc.asyncProperty`.

## Measuring the Tests: Mutation Score, Not Coverage

After the breaker's tests are in, how do you know the suite is strong? Not with coverage, which tells you a line ran, not that anything checked it. Mutation testing changes your code in small ways (a `<` becomes `<=`, a `+` becomes `-`) and re-runs the tests. If they still pass, the mutant **survived**, and your tests missed a behavior.

Stryker defines the mutation score as detected mutants divided by valid mutants, where detected means killed or timed out. Survived and no-coverage mutants count against you.

Install StrykerJS with the Vitest runner, plus Vitest if you do not have it:

```bash
npm i --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner
```

`stryker.config.json`:

```json
{
  "testRunner": "vitest",
  "vitest": {
    "configFile": "vitest.config.ts"
  },
  "mutate": ["src/orders/**/*.ts", "!src/**/*.test.ts"],
  "reporters": ["clear-text", "progress", "html"],
  "thresholds": { "high": 80, "low": 60, "break": 70 }
}
```

A few facts worth knowing, from the Stryker docs:

- `thresholds` is all or nothing: you cannot supply only one value. `break` defaults to `null`, and when the score falls below it Stryker exits with code 1, so CI fails.
- `mutate` accepts `!` to exclude globs. Plugins named `@stryker-mutator/*` are loaded automatically.
- The Vitest runner runs only tests related to the mutated files by default (`vitest.related: true`). Turn it off if your tests do not import the source directly. Browser Mode is not supported, and Stryker overrides some Vitest settings such as `maxWorkers`, `watch` and coverage.
- `incremental: true` stores results and reuses them on the next run, which helps a lot on large codebases.

Run it:

```bash
npx stryker run
```

The report lists survivors, and survivors are the breaker's second job. A typical one:

```text
[Survived] ArithmeticOperator
src/orders/discount.ts:2:14
-   return Math.round(total * (1 - percent / 100) * 100) / 100;
+   return Math.round(total * (1 + percent / 100) * 100) / 100;
```

If that survives, no test checks that a discount actually lowers the price. The second property above should have caught it; if it did not, the property was weaker than I thought. I feed each survivor back to the breaker: "this mutant survived, write the smallest test that kills it." Then I review the test, because an agent can also write a test that kills a mutant for the wrong reason.

I do not chase 100%. Some mutants are equivalent (the behavior does not change), and some code is not worth that cost. A score that trends up on the modules where bugs are expensive is the useful signal.

## The Loop

1. A human writes the spec, and the builder implements it.
2. The breaker, in a separate session with only the spec and interface, proposes attacks as tests and properties.
3. **A human filters.** Each test must match a spec line. Drop the ones that attack something the spec never promised, or fix the spec.
4. Accepted tests enter the contract, protected from the builder as in [Tests as a Contract](/blog/tests-as-a-contract-ai/).
5. Stryker runs. Survivors go back to the breaker for targeted tests, which go back through step 3.
6. The builder fixes the code until all of it is green, without touching the tests.

Step 3 is the part that does not delegate. The breaker is confident and sometimes wrong, and a wrong test that enters the contract will push the builder toward wrong code.

## Limits and Cost

- It costs tokens and time. Stryker multiplies your test runtime by roughly the number of mutants, so run it on the modules that matter and use `incremental` and the `mutate` globs. In CI, I run it on changed files, not everything.
- The breaker is only as good as the spec. A vague spec produces vague attacks, which is a useful signal about the spec.
- Properties are harder to write than examples. Start with a few invariants (never negative, idempotent, round trip, sorted output stays sorted) before anything fancy.
- Two agents can share blind spots too, especially if they are the same model. A different model or a different prompt for the breaker helps, but it does not replace your own review.

## Key Takeaways

- Separate the roles: the builder implements, the breaker attacks with only the spec and the public interface.
- Ask the breaker for properties with `fc.assert` and `fc.property`, not just examples. Save the seed and path from a failure to replay it.
- Judge your suite by Stryker's mutation score, not by coverage. Set `thresholds.break` so CI fails below your bar.
- Feed surviving mutants back as targeted test requests, and review those tests.
- A human decides what enters the contract. The agent proposes, you accept.

## Further Reading

- [fast-check: Getting started](https://fast-check.dev/docs/introduction/getting-started/)
- [fast-check: Parameters interface](https://fast-check.dev/docs/api/interfaces/Parameters/)
- [StrykerJS: Vitest runner](https://stryker-mutator.io/docs/stryker-js/vitest-runner/)
- [StrykerJS: Configuration](https://stryker-mutator.io/docs/stryker-js/configuration/)
- [Stryker: Mutant states and metrics](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/)
