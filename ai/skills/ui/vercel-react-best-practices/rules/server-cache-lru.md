---
title: Cross-Request LRU Caching
impact: HIGH
impactDescription: caches across requests
tags: server, cache, lru, cross-request
---

## Cross-Request LRU Caching

`React.cache()` only works within one request. For data shared across sequential requests (user clicks button A then button B), use an LRU cache **only when justified**.

**Implementation:**

```typescript
import { LRUCache } from "lru-cache"

const cache = new LRUCache<string, unknown>({
  max: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
})

export async function getUser(id: string) {
  const cached = cache.get(id)
  if (cached) return cached

  const user = await db.user.findUnique({ where: { id } })
  cache.set(id, user)
  return user
}

// Request 1: DB query, result cached
// Request 2 (same process): cache hit, no DB query
```

Use when sequential user actions hit multiple endpoints needing the same data within seconds.

**Caveats for life-engine / TanStack Start:**

- Process-local only — serverless or multi-instance deploys do **not** share this cache
- Do not assume multi-request instance reuse (no Vercel Fluid Compute assumption)
- Prefer TanStack Query on the client for user-facing cache; use server LRU sparingly for hot shared lookups
- For true cross-process sharing, use external storage (Redis, etc.) — YAGNI unless measured need

Reference: [https://github.com/isaacs/node-lru-cache](https://github.com/isaacs/node-lru-cache)
