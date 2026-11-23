---
title: "Pruebas E2E para Angular SSR con Playwright"
description: "Configura Playwright en una app Angular SSR: webServer con API y SSR, locators accesibles, fixtures, storageState, chequeo de hidratación y CI estable."
date: 2026-12-21
category: "Testing"
draft: false
---

# Pruebas End-to-End para una App Angular con SSR usando Playwright

**TL;DR:** Una app Angular con SSR tiene dos cosas que las pruebas unitarias no ven: el HTML que manda el servidor antes de que corra cualquier JavaScript y la hidratación que toma el control después. Playwright cubre las dos. En este post armo una suite pequeña para una app inventada de pedidos: un `webServer` que levanta la API y el servidor SSR, locators basados en roles, un login hecho una sola vez con `storageState`, un fixture que crea datos aislados, una verificación de que el HTML del servidor ya trae el contenido y una configuración de CI con reintentos y trazas. Uso como modelo mental el monorepo de mi [post de Angular 21 SSR, Fastify y Drizzle](/es/blog/angular-21-ssr-fastify-drizzle-monorepo/): app Angular, API en Fastify y PostgreSQL.

## Qué Probar End to End (y Qué No)

Las pruebas E2E son lentas y caras de depurar, así que las reservo para lo que solo un navegador real y un servidor real pueden demostrar:

- Unos cuantos **recorridos críticos**: iniciar sesión, crear un pedido, verlo en la lista.
- **Puntos de integración**: que la app Angular realmente hable con la API y que la API realmente hable con la base de datos.
- **Comportamiento propio del SSR**: que el contenido esté en el HTML inicial y que la hidratación termine sin errores.

No uso E2E para reglas de validación, helpers de formato ni estados de componentes. Eso va en pruebas unitarias y de componentes, donde un fallo apunta a una línea y no a todo el stack. Una regla útil: si una prueba necesita base de datos, servidor y navegador para revisar un `toUpperCase()`, está en la capa equivocada.

La IA puede ayudar, pero solo con el primer borrador: un modelo convierte bastante bien un recorrido descrito en palabras en un esqueleto de test. Los locators, los datos y las aserciones siguen siendo tuyos.

## Instalar y Configurar

```bash
npm init playwright@latest
```

El instalador crea `playwright.config.ts`, una carpeta `tests/` y un spec de ejemplo, y ofrece descargar los navegadores y agregar un workflow de GitHub Actions. En máquinas de CI también necesitas las dependencias del sistema:

```bash
npx playwright install --with-deps
```

## Levantar Todo el Stack con `webServer`

La opción `webServer` acepta un arreglo y cada entrada lanza su propio proceso. Es justo lo que necesita una app SSR con una API separada. Playwright espera a que cada `url` responda antes de correr los tests.

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

Algunos detalles que vale la pena conocer:

- `url` reemplaza a la opción obsoleta `port`. Playwright considera "listas" las respuestas 2xx, 3xx y 400-403.
- `reuseExistingServer: !process.env.CI` te deja reutilizar servidores que ya tengas corriendo en local, mientras que CI siempre arranca unos limpios.
- `timeout` vale 60 segundos por defecto; si antes de servir hay un paso de build, necesitas más.
- `env` se mezcla sobre `process.env`; así apunto la API a una **base de datos de pruebas** (un contenedor de Postgres aparte, nunca el de desarrollo).

El servidor SSR debe servir el build de producción, así que haz el build (`ng build`) como paso previo a `playwright test`. Probar con `ng serve` esconde problemas que solo aparecen en la salida SSR real.

## Locators que Sobreviven a los Refactors

Prefiere los locators que recomienda Playwright: primero `getByRole`, luego `getByText`, `getByLabel` y `getByTestId` como último recurso. Son lo mismo que percibe un usuario o un lector de pantalla, así que las pruebas sirven también como chequeo barato de accesibilidad: si `getByRole('button', { name: 'Create order' })` falla, probablemente un usuario real tampoco encuentra ese botón.

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

Fíjate que no hay `waitForTimeout`. Aserciones como `toBeVisible`, `toHaveText` y `toHaveURL` son web-first: reintentan hasta que la condición se cumple o se agota el timeout (5 segundos por defecto). Eso elimina casi todo el código de "espera y ojalá".

## Login una Sola Vez con `storageState`

Iniciar sesión por la UI en cada test es perder tiempo. El proyecto `setup` de arriba corre un único test que hace login y guarda cookies y local storage en un archivo. Los demás proyectos cargan ese archivo con `storageState`.

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

Agrega `playwright/.auth` al `.gitignore`: el archivo contiene cookies de sesión y la documentación desaconseja subirlo al repo. Si un test debe correr sin sesión, sobrescríbelo localmente con `test.use({ storageState: { cookies: [], origins: [] } })`.

## Fixtures y Datos de Prueba Aislados

Los datos compartidos son la causa número uno de tests intermitentes. Dos tests que editan "el primer pedido" terminarán chocando cuando corran en paralelo. Los fixtures lo resuelven: el código antes de `await use()` es el setup, el código después es el teardown, y cada test recibe un objeto nuevo.

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

Crear datos por la API en lugar de por la UI es más rápido y mantiene cada test enfocado en una sola cosa. El nombre de cliente único evita que workers en paralelo compartan filas.

## Verificar SSR e Hidratación

Esta es la parte que una suite de SPA normal nunca necesita. Dos verificaciones bastan para la mayoría de las apps.

**1. El HTML del servidor ya trae el contenido.** El fixture `request` pide la página sin ejecutar JavaScript, así que lo que recibes es exactamente lo que renderizó el servidor SSR:

```ts
test('server renders the order list', async ({ request, order }) => {
  const response = await request.get('/orders')
  expect(response.ok()).toBeTruthy()

  const html = await response.text()
  expect(html).toContain(order.customer)
})
```

Si esto falla mientras la prueba con navegador pasa, tu página se está renderizando en el cliente por accidente: un guard con `isPlatformBrowser`, una petición que solo corre después de la hidratación o un componente detrás de `@defer` con el trigger equivocado. Ojo: las cookies de `storageState` también se aplican a esta petición, lo cual importa si la página está detrás de un login.

**2. Sin errores de hidratación ni de runtime.** En modo desarrollo Angular registra en la consola del navegador los desajustes de hidratación (errores del estilo `NG0500`), y cualquier excepción no capturada dispara `pageerror`. Recolecta ambos y haz fallar el test:

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

Ten en cuenta que los builds de producción eliminan casi todos los diagnósticos detallados de hidratación de Angular. Esta verificación sigue valiendo la pena porque atrapa errores lanzados y peticiones fallidas, pero haz una corrida en modo desarrollo de vez en cuando si sospechas un desajuste.

## CI: Reintentos, Trazas y Cero Tests Intermitentes

La configuración de arriba ya tiene los dos ajustes que importan en CI: `retries: process.env.CI ? 2 : 0` y `trace: 'on-first-retry'`. Playwright graba una traza solo cuando un test falla una vez y se reintenta, así que las corridas verdes siguen rápidas y las fallidas traen una línea de tiempo completa: acciones, red, consola y snapshots del DOM por cada paso.

Un job mínimo de GitHub Actions:

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

Descarga el reporte, ábrelo con `npx playwright show-report` y haz clic en el ícono de traza junto al test fallido.

Los reintentos son una red de seguridad, no una solución. Playwright marca como **flaky** (intermitente) un test que falla y luego pasa, y aparece en el reporte. Trata cada etiqueta flaky como un bug por investigar: datos compartidos, un `await` olvidado, una aserción sin matcher web-first o una carrera entre la hidratación y tu primer clic.

## Puntos Clave

- Deja E2E para recorridos críticos, puntos de integración y comportamiento SSR; el resto baja a pruebas unitarias y de componentes.
- `webServer` acepta un arreglo: levanta la API y el servidor SSR juntos, espera por una `url` y apunta la API a una base de datos de pruebas dedicada.
- Haz el build de producción antes de correr la suite para probar lo que realmente publicas.
- Usa `getByRole`, `getByLabel` y aserciones web-first; evita timeouts fijos y selectores CSS.
- Haz login una vez en un proyecto `setup` y reutiliza la sesión con `storageState`; nunca subas el archivo de estado al repo.
- Los fixtures con setup y teardown dan datos propios a cada test, y eso es lo que estabiliza las corridas en paralelo.
- Pide la página con el fixture `request` para comprobar que el HTML viene del servidor, y escucha `pageerror` y `console` para atrapar problemas de runtime.
- En CI usa `retries`, `trace: 'on-first-retry'` y sube el reporte; arregla todo lo que Playwright marque como flaky.

## Lecturas Recomendadas

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
