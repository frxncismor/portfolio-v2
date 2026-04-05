---
title: "From Frontend to Full-Stack: What Actually Changes When You Own the Whole System"
description: "I spent years as an Angular specialist. Then I shipped complete systems. Here's what nobody tells you about the jump — the infrastructure decisions, the failure modes, and why the frontend mindset both helps and hurts you."
date: 2026-04-05
category: "Backend"
draft: false
---

# From Frontend to Full-Stack: What Actually Changes When You Own the Whole System

**TL;DR:** Owning a full system is not "frontend plus a few API routes." It's a different discipline with different failure modes, different mental models, and different stakes. This post is about what actually shifts when you cross that line — drawn from shipping complete systems with Node.js, Docker, Traefik, Supabase, and production observability.

---

I started as an Angular specialist. I knew change detection cold. I could tell you why `OnPush` wasn't re-rendering before you finished the sentence. I built interfaces for Disney, Royal Caribbean, and United Airlines at Globant — complex, high-traffic SPAs where the frontend was the product.

Then I started owning complete systems. And I discovered that everything I knew was still useful, but none of it was sufficient.

This is not a "backend is harder than frontend" take. It's more specific than that.

## The Mindset Shift Nobody Names

On the frontend, your worst case is a broken render. The user sees something wrong, you fix it, you deploy. The feedback loop is visual and immediate.

On the backend — and especially once you include infrastructure — your worst case is silent data corruption, a cascade failure at 3am, or a security breach that happened six hours ago and you're only finding out now.

**The shift is from "does it look right" to "is it actually correct, right now, even when no one is watching."**

This sounds obvious. It isn't. The instinct to reach for the browser and verify visually is so ingrained in frontend developers that it takes months to replace it with the instinct to reach for logs, metrics, and traces.

## The Stack I Ended Up With

Before going into lessons, here is the actual stack I built around. This matters because "full-stack" can mean a hundred different things:

- **API layer**: Node.js + Express (TypeScript)
- **Database**: Supabase (PostgreSQL) and SQL Server / MySQL for legacy systems
- **Infrastructure**: VPS with Docker Compose, Traefik as reverse proxy, Watchtower for automated container updates
- **Observability**: Datadog (metrics + APM), Sentry (errors + traces), Microsoft Clarity (session replay)
- **Analytics**: Umami (self-hosted, privacy-first), Google Analytics

Not Kubernetes. Not microservices. A single VPS running Docker Compose, properly configured, handles significant traffic and costs a fraction of what cloud-managed services would. That is a deliberate choice with real tradeoffs — more on that later.

## What Traefik Changed About How I Think About Routing

Before running my own reverse proxy, I thought of routing as an application-level concern. You define routes in Express, they do what you say, done.

Traefik changed this completely. When Traefik is in front of your services, routing becomes infrastructure-level. TLS termination, automatic Let's Encrypt certificate renewal, service discovery via Docker labels, load balancing, middleware for rate limiting and authentication — none of this lives in your application code.

```yaml
# docker-compose.yml — a realistic Traefik + Express setup
version: "3.8"

services:
  traefik:
    image: traefik:v3.0
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=your@email.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt

  api:
    build: ./api
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.yourdomain.com`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      # Redirect HTTP → HTTPS at the infrastructure level
      - "traefik.http.routers.api-http.rule=Host(`api.yourdomain.com`)"
      - "traefik.http.routers.api-http.entrypoints=web"
      - "traefik.http.routers.api-http.middlewares=redirect-to-https"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"

volumes:
  letsencrypt:
```

The key insight: **your Express app does not know it is behind Traefik.** It listens on its container port and does its job. Infrastructure concerns are separated at the infrastructure layer. This is separation of concerns applied at the system level, not the code level.

The gotcha that bites everyone: when Traefik terminates TLS, `req.secure` in Express will be `false` even for HTTPS requests, because Express is receiving HTTP from the proxy. You need to trust the `X-Forwarded-Proto` header:

```typescript
// In your Express app setup — required when behind a reverse proxy
app.set('trust proxy', 1)

// Now req.secure and req.ip work correctly
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`)
  }
  next()
})
```

## Error Handling Is Not Optional

On the frontend, an unhandled error crashes a component. On the backend, an unhandled promise rejection in Express (before Node.js 15) would silently swallow the error and leave the request hanging.

```typescript
// This is NOT enough — async errors are not caught by Express by default
app.get('/users/:id', async (req, res) => {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id])
  res.json(user)
  // If db.query throws, Express never sees it — the request hangs in older versions
})
```

The correct pattern is to wrap every async route handler, or use a utility that does it for you:

```typescript
// Option A: explicit try/catch — verbose but explicit
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id])
    res.json(user)
  } catch (err) {
    next(err) // passes to Express error middleware
  }
})

// Option B: wrapper utility — less noise
const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id])
  res.json(user)
}))

// Centralized error handler — always define this
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  })
})
```

Note: Express 5 (stable as of 2024) handles async errors natively — `next(err)` is called automatically for rejected promises. If you are on Express 5, the wrapper is unnecessary. If you are on Express 4, it is not optional.

## Observability: The Thing Frontend Developers Underestimate Most

On the frontend, the browser DevTools are your observability layer. They are always there, always free, always showing you everything.

On the backend, there is no DevTools. There is only what you instrument.

I use a three-layer observability setup:

1. **Sentry** — captures exceptions with full stack traces, request context, and breadcrumbs. Fires an alert the moment something breaks in production.
2. **Datadog** — metrics, APM traces, infrastructure monitoring. Answers "is the API slow right now?" and "which endpoint is consuming 80% of CPU?"
3. **Microsoft Clarity** — session replay for the frontend. When a user reports a bug, you watch exactly what they did.

Setting up Sentry in a Node.js/Express API is straightforward, but the initialization order matters:

```typescript
import * as Sentry from '@sentry/node'
import express from 'express'

// Sentry MUST be initialized before importing anything else
// that might throw — especially database clients
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // Capture 10% of traces in production — 100% in dev/staging
})

const app = express()

// Sentry request handler — must be first middleware
app.use(Sentry.Handlers.requestHandler())
// Sentry tracing handler
app.use(Sentry.Handlers.tracingHandler())

// ... your routes ...

// Sentry error handler — must be before your own error handler
app.use(Sentry.Handlers.errorHandler())

// Your error handler comes after Sentry's
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: 'Internal server error' })
})
```

The tracesSampleRate is important. In production, capturing 100% of traces generates significant volume and cost. 10% gives you a statistically meaningful sample without bankrupting the observability budget. Adjust based on your traffic.

## Watchtower and the Automated Deployment Problem

One pattern I use that surprises frontend developers: **automated container updates via Watchtower**.

```yaml
# docker-compose.yml addition
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 30 --cleanup
    # Checks for new images every 30 seconds, removes old ones
```

Watchtower watches your running containers. When you push a new image to your registry, Watchtower detects it, pulls the new image, and restarts the container with zero downtime (with the `--rolling-restart` flag).

Your CI/CD pipeline becomes: build → push image → Watchtower deploys automatically.

This is appropriate for personal projects and small teams where the deployment risk is low and the convenience is high. For production systems with strict uptime requirements, you want more control over deployment timing — blue/green deployments, health checks before traffic cutover, and rollback automation. Watchtower trades control for simplicity.

Know what you're trading. That's the full-stack mindset.

## The Database Is Not Your Frontend State Manager

This one tripped me up early. On the frontend, you are used to optimistic updates — update the local state immediately, sync with the server later. The UI feels fast. If the sync fails, you roll back.

On the backend, you are the server. There is no "later." Either the data is consistent right now, or it is not.

```typescript
// This is wrong — two operations with no atomicity guarantee
async function transferBalance(fromId: string, toId: string, amount: number) {
  await db.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromId])
  // If the process crashes here, money is gone from one account but not added to the other
  await db.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId])
}

// This is correct — a transaction guarantees atomicity
async function transferBalance(fromId: string, toId: string, amount: number) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromId])
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
```

The financial example is dramatic but the principle applies anywhere: whenever two or more database operations must succeed or fail together, use a transaction. This is not a performance optimization — it is a correctness requirement.

## The Tradeoffs I Accepted

I promised to be honest about the tradeoffs of this stack.

**VPS + Docker Compose vs. managed cloud:**

| | VPS + Docker Compose | Managed Cloud (Render, Railway, ECS) |
|---|---|---|
| Cost | Low (fixed monthly) | Higher (scales with usage) |
| Control | Full — you configure everything | Limited to what the platform exposes |
| Maintenance | You own server updates, security patches | Platform handles it |
| Scaling | Manual — add a server, update Compose | Automatic |
| Failure recovery | You fix it | Platform handles container restarts |

For projects with moderate traffic and a solo developer or small team, VPS + Docker Compose is a rational choice. For a startup that needs to scale unpredictably, or a team without infrastructure experience, managed platforms reduce operational risk.

Neither is universally correct. **The mistake is not making a deliberate choice.**

## What the Frontend Background Actually Gave Me

After all the "it's different and harder" — what carried over?

**Component thinking.** The habit of decomposing a problem into small, independent units maps perfectly to service design and middleware composition. An Express middleware chain is architecturally identical to Angular's dependency injection pipeline: small functions with single responsibilities, composed in order.

**State management discipline.** Years of thinking carefully about where state lives, who owns it, and how mutations propagate made me much better at database schema design. The questions are the same — just at a different layer.

**User empathy.** Backend developers who have never built frontends often design APIs that are technically correct but miserable to consume. Having lived on both sides, I know what response shapes are actually useful, what error messages actually help, and why latency matters more than the server-side code suggests.

The jump is real. But the foundation is not wasted.

## Key Takeaways

- **The mental model shift is the hardest part**: from "does it look right" to "is it actually correct when no one is watching."
- **Traefik belongs at the infrastructure layer, not the application layer**: TLS, HTTPS redirects, and routing are not your Express app's job.
- **Async error handling in Express requires explicit work** — either `try/catch` + `next(err)`, or Express 5.
- **Instrument before you need it**: Sentry + Datadog on day one, not after the first production incident.
- **Transactions are a correctness requirement, not an optimization**: if two DB operations must succeed together, wrap them in a transaction.
- **Know your tradeoffs**: VPS + Docker Compose, managed platform, and Kubernetes each make sense in different contexts. The mistake is not choosing deliberately.

## Further Reading

- [Traefik v3 Documentation](https://doc.traefik.io/traefik/) — the official docs are genuinely good
- [Express.js Error Handling Guide](https://expressjs.com/en/guide/error-handling.html) — the async section is the part most people miss
- [Sentry Node.js SDK Documentation](https://docs.sentry.io/platforms/javascript/guides/node/) — initialization order and sampling configuration
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) — the authoritative source on ACID guarantees
- [Watchtower Documentation](https://containrrr.dev/watchtower/) — when automated updates make sense and when they don't
