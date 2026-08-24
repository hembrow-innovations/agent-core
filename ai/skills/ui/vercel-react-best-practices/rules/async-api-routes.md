---
title: Prevent Waterfall Chains in Server Functions
impact: CRITICAL
impactDescription: 2-10× improvement
tags: server-functions, api-routes, waterfalls, parallelization
---

## Prevent Waterfall Chains in Server Functions

In `createServerFn` handlers and API routes, start independent operations immediately, even if you don't await them yet.

**Incorrect (config waits for auth, data waits for both):**

```typescript
import { createServerFn } from "@tanstack/react-start"

const loadDashboardFn = createServerFn({ method: "GET" }).handler(async () => {
  const session = await auth()
  const config = await fetchConfig()
  const data = await fetchData(session.user.id)
  return { data, config }
})
```

**Correct (auth and config start immediately):**

```typescript
import { createServerFn } from "@tanstack/react-start"

const loadDashboardFn = createServerFn({ method: "GET" }).handler(async () => {
  const sessionPromise = auth()
  const configPromise = fetchConfig()
  const session = await sessionPromise
  const [config, data] = await Promise.all([
    configPromise,
    fetchData(session.user.id),
  ])
  return { data, config }
})
```

**API route variant:**

```typescript
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/dashboard")({
  server: {
    handlers: {
      GET: async () => {
        const sessionPromise = auth()
        const configPromise = fetchConfig()
        const session = await sessionPromise
        const [config, data] = await Promise.all([
          configPromise,
          fetchData(session.user.id),
        ])
        return Response.json({ data, config })
      },
    },
  },
})
```

For operations with more complex dependency chains, use `better-all` to automatically maximize parallelism (see Dependency-Based Parallelization).
