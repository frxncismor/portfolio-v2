---
title: "Migrate Angular Unit Tests from Karma to Vitest"
description: "Step-by-step guide to move an Angular project from Karma and Jasmine to Vitest: builder, schematic, spies, TestBed, coverage and CI."
date: 2027-02-08
category: "Angular"
cover: "migration"
draft: false
---

# Migrating Angular Unit Tests from Karma to Vitest

**TL;DR:** Angular's unit-test builder (`@angular/build:unit-test`) runs your specs with Vitest, and new CLI projects use it by default. Karma still works, but it is the old path. Moving an existing project takes six steps: install Vitest and a DOM, switch the builder, remove Karma, run the official schematic, fix what it could not convert, and wire up coverage and CI. One honest caveat first: the Angular docs still call the migration of existing projects **experimental**, and the schematic too, so treat its output as a draft to review, not a finished refactor.

This guide follows the same step format as my [ESLint and Prettier guide for Angular 20](/blog/how-to-setup-eslint-and-prettier-in-angular-20-projects/). The examples use a made-up `orders` app.

## Why Move Away from Karma

- **It needs a real browser for everything.** Launching Chrome for a pure logic test is overhead you pay on every run, in CI and locally.
- **Watch mode and feedback speed.** Vitest re-runs only what changed and starts fast, which is the difference between running tests constantly and running them before the push.
- **One test language across the stack.** I already use Vitest on Node services, so `vi.fn`, `describe` and `expect` are the same everywhere.
- **Karma is on its way out.** The Angular docs treat Vitest as the default and Karma as still supported, which is a polite way to say you should plan the move.

Tests run in jsdom by default, and the builder can also run them in a real browser when you need one (more on that in Step 6).

## Step 1: Install Dependencies

```bash
npm install --save-dev vitest jsdom
```

The CLI detects `happy-dom` if it is installed and otherwise falls back to `jsdom`. The migration also requires the `application` build system, which is what new Angular projects use. If you still have the legacy `browser` builder for your app, migrate that first.

## Step 2: Switch the Builder in `angular.json`

Change the builder of the `test` target:

```json
"test": {
  "builder": "@angular/build:unit-test"
}
```

Defaults are `"tsConfig": "tsconfig.spec.json"` and `"buildTarget": "::development"`. That second one matters: the builder no longer accepts `polyfills`, `assets` or `styles` on the test target. If tests need something different from your development build, put it in a dedicated build configuration.

Useful options you can add under `options`:

```json
"options": {
  "include": ["src/**/*.spec.ts"],
  "setupFiles": ["src/test-setup.ts"],
  "providersFile": "src/test-providers.ts",
  "coverage": false
}
```

`providersFile` is a nice one: it exports default providers applied to every test, which replaces a lot of repeated `TestBed.configureTestingModule` boilerplate.

## Step 3: Remove Karma

```bash
npm uninstall karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter jasmine-core
```

Delete `karma.conf.js` and `src/test.ts`. Anything custom in your Karma config is **not** migrated for you:

- Reporters become Vitest reporters.
- Karma plugins need a Vitest equivalent; coverage is built in.
- Custom browser launchers become the `browsers` option plus a browser provider.

If you also need a custom Vitest configuration, generate a base file and point the builder at it:

```bash
ng generate config vitest
```

This creates `vitest-base.config.mts`. Reference it with `"runnerConfig": "vitest-base.config.mts"` (or set `runnerConfig` to `true` and the builder searches for a `vitest-base.config.*` file). The Angular CLI overrides `test.projects` and `test.include`, so do not rely on those in your file.

## Step 4: Run the Schematic

```bash
ng g @schematics/angular:refactor-jasmine-vitest
```

It rewrites Jasmine syntax into Vitest syntax across your specs. Options you will probably use:

| Option | What it does |
|---|---|
| `--project <name>` | Target one project in a workspace |
| `--include <path>` | Refactor a single file or folder (start here) |
| `--add-imports` | Add explicit `vitest` imports if globals are disabled |
| `--verbose` | Log every transformation |

It does not install packages, edit `angular.json` or delete Karma files, which is why Steps 1 to 3 come first. My advice: run it on one folder with `--include`, read the diff, then run it on the rest.

## Step 5: Fix What the Schematic Could Not Convert

The mapping is mostly mechanical:

| Jasmine | Vitest |
|---|---|
| `spyOn` | `vi.spyOn` |
| `jasmine.createSpy` | `vi.fn` |
| `jasmine.any` | `expect.any` |
| `jasmine.objectContaining` | `expect.objectContaining` |
| `fit` / `fdescribe` | `it.only` / `describe.only` |
| `xit` / `xdescribe` | `it.skip` / `describe.skip` |
| `fail()` | `expect.fail()` |

Complex or nested spies get TODO comments instead of a conversion. Look for these by hand.

Spies behave differently from Jasmine in one important way: a Jasmine `spyOn` stubs the method by default, while Vitest's `vi.spyOn` **calls through** unless you give it an implementation. State your intent:

```ts
// before (Jasmine)
const repo = jasmine.createSpyObj<OrdersRepository>('OrdersRepository', ['findAll']);
repo.findAll.and.returnValue(Promise.resolve([]));

// after (Vitest)
const repo = { findAll: vi.fn().mockResolvedValue([]) };
```

```ts
const spy = vi.spyOn(orderService, 'total').mockReturnValue(100);
// remember to restore real implementations between tests
afterEach(() => vi.restoreAllMocks());
```

Timers and `fakeAsync` need a decision. The docs offer two paths: keep `fakeAsync`, `flush` and `waitForAsync` by adding `zone.js/plugins/vitest-patch` to the test target's `polyfills`, or (my preference) rewrite them as native `async` code with Vitest fake timers:

```ts
it('debounces the search', async () => {
  vi.useFakeTimers();
  component.query.set('acme');

  await vi.advanceTimersByTimeAsync(300);

  expect(searchSpy).toHaveBeenCalledTimes(1);
  vi.useRealTimers();
});
```

A test written this way also keeps working when you later drop Zone.js.

A `TestBed` spec for a standalone component with signals needs no special treatment. This is the same code you would have written with Jasmine, only with `vi` for the mock:

```ts
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi } from 'vitest';
import { OrderList } from './order-list';
import { OrdersRepository } from './orders.repository';

describe('OrderList', () => {
  it('shows the orders returned by the repository', async () => {
    const repo = { findAll: vi.fn().mockResolvedValue([{ id: '1', customer: 'Acme' }]) };
    TestBed.configureTestingModule({
      imports: [OrderList],
      providers: [{ provide: OrdersRepository, useValue: repo }],
    });

    const fixture = TestBed.createComponent(OrderList);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Acme');
    expect(repo.findAll).toHaveBeenCalledOnce();
  });
});
```

The explicit `vitest` import is only needed if you disabled globals (or used `--add-imports`).

## Step 6: Coverage, Scripts and CI

Coverage is a flag on the builder:

```bash
ng test --coverage
```

The report lands in `coverage/`. Vitest's default provider is v8; if the run asks for a coverage package, install it with `npm i -D @vitest/coverage-v8`. For thresholds, use the `coverage.thresholds` option of Vitest in your runner config:

```ts
// vitest-base.config.mts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
```

I have not verified end to end that every coverage option passes through the Angular builder in every version, so break a threshold on purpose once and confirm the run fails.

Scripts in `package.json`:

```json
{
  "scripts": {
    "test": "ng test",
    "test:ci": "ng test --no-watch --no-progress --coverage"
  }
}
```

`ng test` watches by default in an interactive terminal. On CI servers that set `CI=true` the run is single-shot and headless; if yours does not, `--no-watch --no-progress` makes it explicit. A GitHub Actions step is just `npm run test:ci`.

If you want real browser tests, install a provider such as `@vitest/browser-playwright` and set `"browsers": ["chromium"]` in the options (use `chromiumHeadless` from the command line for headless runs).

## What Not to Migrate by Hand

Mechanical rewrites are where AI saves time, with one rule: it works on a **diff you review**, never on a pile of changes you merge blind. A good split:

- Let the schematic do the syntax conversion.
- Ask an assistant to propose rewrites for the TODOs it leaves (nested spies, `createSpyObj`, `done` callbacks), one folder at a time, and read each diff.
- Do the judgment calls yourself: what to do with `fakeAsync`, which tests were testing the framework instead of your code, which ones to delete.

Run the suite before and after: the number of passing tests should not shrink silently.

## Key Takeaways

- `@angular/build:unit-test` runs Vitest; new Angular projects already use it, and Karma is the legacy path.
- The migration of existing projects is documented as experimental: review the schematic output, do not trust it blindly.
- The order is: install, switch builder, remove Karma, run `refactor-jasmine-vitest`, fix leftovers, set coverage and CI.
- `vi.spyOn` calls through by default; `jasmine.createSpyObj` becomes plain objects with `vi.fn()`.
- Prefer native `async` plus `vi.useFakeTimers()` over `fakeAsync`; the Zone.js `vitest-patch` polyfill is the bridge if you need it.
- Coverage is `ng test --coverage`; thresholds live in the Vitest runner config.

## Further Reading

- [Angular: Migrating from Karma and Jasmine to Vitest](https://angular.dev/guide/testing/migrating-to-vitest)
- [Angular: Testing](https://angular.dev/guide/testing)
- [Vitest: vi API](https://vitest.dev/api/vi.html)
- [Vitest: Coverage guide](https://vitest.dev/guide/coverage.html)
- [Vitest: Coverage configuration](https://vitest.dev/config/coverage)
