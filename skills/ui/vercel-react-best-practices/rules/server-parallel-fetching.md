---
title: Parallel Data Pre-Warming in Route Loaders
impact: CRITICAL
impactDescription: eliminates server-side waterfalls
tags: server, loader, parallel-fetching, tanstack-router
---

## Parallel Data Pre-Warming in Route Loaders

Use `Promise.all()` in TanStack Router loaders to pre-warm multiple queries in parallel. Avoid sequential `await` calls that create waterfalls.

**Incorrect (header waits for sidebar data):**

```ts
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(headerQueryOptions(context.supabase))
    await context.queryClient.ensureQueryData(sidebarQueryOptions(context.supabase))
  },
  component: DashboardPage,
})
```

**Correct (both fetch simultaneously):**

```ts
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(headerQueryOptions(context.supabase)),
      context.queryClient.ensureQueryData(sidebarQueryOptions(context.supabase)),
    ])
  },
  component: DashboardPage,
})
```

**With a partial dependency (one depends on another's result):**

```ts
loader: async ({ context }) => {
  const sessionPromise = getSessionClaimsSafe()
  const configPromise = context.queryClient.ensureQueryData(configQueryOptions())

  const session = await sessionPromise
  const [config] = await Promise.all([
    configPromise,
    context.queryClient.ensureQueryData(userQueryOptions(session.sub)),
  ])
}
```

Start promises immediately, await them together. Route loaders run on the server during SSR — eliminating waterfalls here reduces Time to First Byte.