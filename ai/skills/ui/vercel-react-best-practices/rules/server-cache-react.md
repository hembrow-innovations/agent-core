---
title: Per-Request Deduplication with React.cache()
impact: MEDIUM
impactDescription: deduplicates within request
tags: server, cache, react-cache, deduplication
---

## Per-Request Deduplication with React.cache()

Use `React.cache()` for server-side request deduplication within a single request. Authentication and database queries benefit most. Prefer this in TanStack Start server functions / loaders when the same helper is called multiple times per request.

**Usage:**

```typescript
import { cache } from "react"

export const getCurrentUser = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) return null
  return await db.user.findUnique({
    where: { id: session.user.id },
  })
})
```

Within a single request, multiple calls to `getCurrentUser()` execute the query only once.

**Avoid inline objects as arguments:**

`React.cache()` uses shallow equality (`Object.is`) to determine cache hits. Inline objects create new references each call, preventing cache hits.

**Incorrect (always cache miss):**

```typescript
const getUser = cache(async (params: { uid: number }) => {
  return await db.user.findUnique({ where: { id: params.uid } })
})

// Each call creates new object, never hits cache
getUser({ uid: 1 })
getUser({ uid: 1 }) // Cache miss, runs query again
```

**Correct (cache hit):**

```typescript
const getUser = cache(async (uid: number) => {
  return await db.user.findUnique({ where: { id: uid } })
})

// Primitive args use value equality
getUser(1)
getUser(1) // Cache hit, returns cached result
```

If you must pass objects, pass the same reference:

```typescript
const params = { uid: 1 }
getUser(params) // Query runs
getUser(params) // Cache hit (same reference)
```

**Scope:**

- Deduplicates **within one request only** — not across requests
- Useful for: auth checks, DB helpers, heavy computations, non-fetch async work shared across a loader tree
- TanStack Start does **not** auto-memoize `fetch` like Next.js — use `React.cache()` (or TanStack Query on the client) when you need dedupe

Reference: [React.cache documentation](https://react.dev/reference/react/cache)
