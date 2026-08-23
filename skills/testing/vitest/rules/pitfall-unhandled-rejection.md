---
title: Await every promise the test starts
impact: CRITICAL
impactDescription: Unhandled Rejection, or a pass that never asserted
tags: [pitfall, async]
---

## Await every promise the test starts

An async call without `await` rejects after the test ends. Vitest reports an unhandled rejection, or worse, the test is green.

**Incorrect:**
```ts
test("fetches user", async () => {
  fetchUser(123);
});
```

**Correct:**
```ts
test("fetches user", async () => {
  await expect(fetchUser(123)).resolves.toMatchObject({ id: 123 });
});
```

Notes: There is no `done` callback. See `async-await`.
