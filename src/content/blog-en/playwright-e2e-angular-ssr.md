---
title: "End-to-End Tests for Angular SSR with Playwright"
description: "Set up Playwright for an Angular SSR app: webServer with API and SSR, accessible locators, fixtures, storageState, hydration checks and stable CI runs."
date: 2026-12-21
category: "Testing"
cover: "e2e"
draft: false
---

# End-to-End Tests for an Angular SSR App with Playwright

**TL;DR:** An Angular SSR app has two things unit tests cannot see: the HTML the server sends before any JavaScript runs, and the hydration step that takes over afterwards. Playwright covers both. In this post I set up a small suite for a made-up orders app: a `webServer` that boots the API and the SSR server, locators based on roles, a login done once with `storageState`, a fixture that creates isolated test data, a check that the server HTML already contains the content, and a CI setup with retries and traces. I use the monorepo from my [Angular 21 SSR, Fastify, Drizzle monorepo post](/blog/angular-21-ssr-fastify-drizzle-monorepo/) as the mental model: Angular app, Fastify API, PostgreSQL.

## What to Test End to End (and What Not To)

E2E tests are slow and expensive to debug, so I keep them for what only a real browser and a real server can prove:

- A handful of **critical user journeys**: sign in, create an order, see it in the list.
- **Integration seams**: the Angular app really talks to the API and the API really talks to the database.
- **SSR-specific behavior**: the content is in the initial HTML, and hydration finishes without errors.

I do not use E2E for validation rules, formatting helpers or component states. Those belong in unit and component tests, where a failure points at one line instead of a whole stack. A good rule: if a test needs a database, a server and a browser to check a `toUpperCase()`, it is in the wrong layer.

AI can help here, but only with the first draft: a model is decent at turning a user journey written in plain words into a test skeleton. You still own the locators, the data and the assertions.

## Install and Configure

```bash
npm init playwright@latest
```

The installer creates `playwright.config.ts`, a `tests/` folder and an example spec, and offers to download browsers and add a GitHub Actions workflow. For CI machines you also need the system dependencies:

```bash
npx playwright install --with-deps
```

## Starting the Whole Stack with `webServer`

The `webServer` option accepts an array, and each entry launches its own process. That is what an SSR app with a separate API needs. Playwright waits until each `url` answers before running tests.

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
  webServer: [
    {
      name: 'API',
      command: 'npm run start --workspace=api',
      url: 'http://localhost:3000/health',
      env: { DATABASE_URL: 'postgres://orders:orders@localhost:5433/orders_test' },
      reuseExistingServer: !process.env.CI,
    },
    {
      name: 'Web',
      command: 'npm run serve:ssr:web',
      url: 'http://localhost:4000',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
```

A few details worth knowing:

- `url` replaces the deprecated `port` option. Playwright treats 2xx, 3xx and 400-403 responses as "ready".
- `reuseExistingServer: !process.env.CI` lets you reuse servers you already have running locally, while CI always starts clean ones.
- `timeout` defaults to 60 seconds; a build step before serving needs more.
- `env` is merged on top of `process.env`, which is how I point the API at a **test database** (a separate Postgres container, never the development one).

The SSR server must serve the production build, so build first (`ng build`) as a step before `playwright test`. Testing `ng serve` hides problems that only appear in the real SSR output.

## Locators That Survive Refactors

Prefer the locators Playwright recommends: `getByRole` first, then `getByText`, `getByLabel`, and `getByTestId` as a fallback. They are the same things a user or a screen reader perceives, so the tests double as a cheap accessibility check: if `getByRole('button', { name: 'Create order' })` fails, a real user probably cannot find that button either.

```ts
// e2e/orders.spec.ts
import { test, expect } from '@playwright/test'

test('creates an order', async ({ page }) => {
  await page.goto('/orders')

  await page.getByRole('link', { name: 'New order' }).click()
  await page.getByLabel('Customer').fill('Acme Corp')
  await page.getByLabel('Total').fill('120')
  await page.getByRole('button', { name: 'Create order' }).click()

  await expect(page.getByRole('row', { name: /Acme Corp/ })).toBeVisible()
})
```

Notice there is no `waitForTimeout`. Assertions like `toBeVisible`, `toHaveText` and `toHaveURL` are web-first: they retry until the condition holds or the timeout (5 seconds by default) expires. That removes most of the "sleep and hope" code.

## Login Once with `storageState`

Signing in through the UI in every test wastes time. The `setup` project above runs a single test that logs in and saves the cookies and local storage to a file. Every other project loads that file through `storageState`.

```ts
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('qa@example.com')
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD ?? 'test-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible()
  await page.context().storageState({ path: authFile })
})
```

Add `playwright/.auth` to `.gitignore`: the file contains session cookies and the docs advise against committing it. If one test needs to run logged out, override it locally with `test.use({ storageState: { cookies: [], origins: [] } })`.

## Fixtures and Isolated Test Data

Shared data is the number one source of flaky tests. Two tests that edit "the first order" will eventually collide when they run in parallel. Fixtures solve this: code before `await use()` is setup, code after it is teardown, and the test gets a fresh object.

```ts
// e2e/fixtures.ts
import { test as base, expect } from '@playwright/test'

type Order = { id: string; customer: string }

export const test = base.extend<{ order: Order }>({
  order: async ({ request }, use) => {
    const customer = `Customer ${crypto.randomUUID().slice(0, 8)}`
    const response = await request.post('http://localhost:3000/orders', {
      data: { customer, total: 50 },
    })
    expect(response.ok()).toBeTruthy()
    const order: Order = await response.json()

    await use(order)

    await request.delete(`http://localhost:3000/orders/${order.id}`)
  },
})

export { expect }
```

```ts
// e2e/order-detail.spec.ts
import { test, expect } from './fixtures'

test('shows an order created through the API', async ({ page, order }) => {
  await page.goto(`/orders/${order.id}`)
  await expect(page.getByRole('heading', { name: order.customer })).toBeVisible()
})
```

Creating data through the API instead of the UI is faster and keeps each test focused on one thing. The unique customer name means parallel workers never share rows.

## Verifying SSR and Hydration

This is the part a plain SPA suite never needs. Two checks are enough for most apps.

**1. The server HTML already contains the content.** The `request` fixture fetches the page without running any JavaScript, so what you get back is exactly what the SSR server rendered:

```ts
test('server renders the order list', async ({ request, order }) => {
  const response = await request.get('/orders')
  expect(response.ok()).toBeTruthy()

  const html = await response.text()
  expect(html).toContain(order.customer)
})
```

If this fails while the browser test passes, your page is client-rendered by accident: a guard on `isPlatformBrowser`, a request that only runs after hydration, or a component that lives behind `@defer` with the wrong trigger. Note that the cookies from `storageState` are applied to this request too, which matters when the page is behind a login.

**2. No hydration or runtime errors.** Angular logs hydration mismatches (such as `NG0500`-style errors) to the browser console in dev mode, and any uncaught exception fires `pageerror`. Collect both and fail the test:

```ts
test('orders page hydrates without errors', async ({ page }) => {
  const problems: string[] = []
  page.on('pageerror', (error) => problems.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text())
  })

  await page.goto('/orders')
  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible()

  expect(problems).toEqual([])
})
```

Keep in mind that production builds strip most of Angular's verbose hydration diagnostics. This check is still worth having because it catches thrown errors and failed requests, but do a dev-mode run now and then if you suspect a mismatch.

## CI: Retries, Traces and Not Having Flaky Tests

The config above already contains the two settings that matter in CI: `retries: process.env.CI ? 2 : 0` and `trace: 'on-first-retry'`. Playwright records a trace only when a test fails once and is retried, so green runs stay fast and failing runs come with a full timeline: actions, network, console and DOM snapshots for each step.

A minimal GitHub Actions job:

```yaml
name: e2e
on: [pull_request]
jobs:
  playwright:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test
      - uses: actions/upload-artifact@v5
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

Download the report, open it with `npx playwright show-report`, and click the trace icon next to the failed test.

Retries are a safety net, not a fix. Playwright labels a test that fails and then passes as **flaky**, and it shows up in the report. Treat every flaky label as a bug to investigate: shared data, a missing `await`, an assertion without a web-first matcher, or a race between hydration and your first click.

## Key Takeaways

- Keep E2E for critical journeys, integration seams and SSR behavior; push everything else down to unit and component tests.
- `webServer` takes an array: start the API and the SSR server together, wait on a `url`, and point the API at a dedicated test database.
- Build the production SSR output before running the suite so you test what you ship.
- Use `getByRole`, `getByLabel` and web-first assertions; avoid fixed timeouts and CSS selectors.
- Log in once in a `setup` project and reuse the session with `storageState`; never commit the state file.
- Fixtures with setup and teardown give each test its own data, which is what makes parallel runs stable.
- Fetch the page with the `request` fixture to prove the HTML is server-rendered, and listen to `pageerror` and `console` to catch runtime problems.
- In CI use `retries`, `trace: 'on-first-retry'` and upload the report; fix whatever Playwright marks as flaky.

## Further Reading

- [Playwright: Web server](https://playwright.dev/docs/test-webserver)
- [Playwright: Locators](https://playwright.dev/docs/locators)
- [Playwright: Authentication](https://playwright.dev/docs/auth)
- [Playwright: Fixtures](https://playwright.dev/docs/test-fixtures)
- [Playwright: Assertions](https://playwright.dev/docs/test-assertions)
- [Playwright: Trace viewer](https://playwright.dev/docs/trace-viewer-intro)
- [Playwright: Retries](https://playwright.dev/docs/test-retries)
- [Playwright: Continuous integration](https://playwright.dev/docs/ci-intro)
- [Angular: Server and hybrid rendering](https://angular.dev/guide/ssr)
- [Angular: Hydration](https://angular.dev/guide/hydration)
