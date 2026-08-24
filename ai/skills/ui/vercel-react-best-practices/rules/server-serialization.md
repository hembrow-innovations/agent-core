---
title: Minimize Data Passed from Server to Client
impact: HIGH
impactDescription: reduces data transfer size
tags: server, serialization, props, loader
---

## Minimize Data Passed from Server to Client

Data serialized in loaders and server function responses directly impacts page weight. Only pass fields the client actually uses.

**Incorrect (sends all 50 fields to client):**

```ts
// Loader
loader: async ({ context }) => {
  const user = await fetchUser() // 50 fields
  return { user }
}

// Component
function Profile({ user }: { user: User }) {
  return <div>{user.name}</div> // uses 1 field
}
```

**Correct (sends only 1 field):**

```ts
// Loader
loader: async ({ context }) => {
  const user = await fetchUser()
  return { name: user.name }
}

// Component
function Profile({ name }: { name: string }) {
  return <div>{name}</div>
}
```

**For server functions:**

```ts
const searchFn = createServerFn({ method: "POST" })
  .handler(async (input: { query: string }) => {
    const results = await db.search(input.query) // 20+ fields per row
    // Return only what the UI renders
    return results.map((r) => ({
      id: r.id,
      title: r.title,
      snippet: r.body.slice(0, 200),
    }))
  })
```

This pattern applies to: TanStack Router `loader` return values, `createServerFn` return values, and API route responses.