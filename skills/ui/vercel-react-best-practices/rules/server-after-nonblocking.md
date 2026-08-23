---
title: Fire-and-Forget for Non-Blocking Operations
impact: MEDIUM
impactDescription: faster response times
tags: server, async, logging, analytics, side-effects
---

## Fire-and-Forget for Non-Blocking Operations

Use `void` to mark background work as intentionally non-awaited in TanStack Start server functions. This prevents logging, analytics, and other side effects from delaying the response.

**Incorrect (blocks response):**

```ts
import { createServerFn } from "@tanstack/react-start"

const updateUserFn = createServerFn({ method: "POST" })
  .handler(async (input: { userId: string; data: Record<string, unknown> }) => {
    await db.user.update(input.userId, input.data)
    await logUserAction(input.userId, "update")  // blocks response
    return { success: true }
  })
```

**Correct (fire-and-forget):**

```ts
import { createServerFn } from "@tanstack/react-start"

const updateUserFn = createServerFn({ method: "POST" })
  .handler(async (input: { userId: string; data: Record<string, unknown> }) => {
    await db.user.update(input.userId, input.data)

    void logUserAction(input.userId, "update").catch((err) => {
      console.error("Background log failed:", err)
    })

    return { success: true }
  })
```

The response is sent immediately while logging happens in the background.

**For API routes (server handlers):**

```ts
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/action")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        await performMutation(body)

        void analytics.track("action", { userId: body.userId }).catch(() => {})

        return Response.json({ status: "success" })
      },
    },
  },
})
```

**Common use cases:**
- Analytics tracking
- Audit logging
- Sending notifications
- Cache invalidation
- Cleanup tasks

**Important notes:**
- Always attach `.catch()` to fire-and-forget promises to avoid unhandled rejections
- `void` is syntactic: it marks the promise as intentionally non-awaited
- Do not fire-and-forget if the caller needs confirmation the side effect completed