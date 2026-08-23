---
title: Share fixtures with test.extend
impact: MEDIUM
impactDescription: copied beforeEach blocks drift
tags: [setup]
---

## Share fixtures with test.extend

When several files need the same db or app, `test.extend` is the fixture. A mega `setupFiles` that hides state is not.

**Incorrect:** A 200-line `setupFiles` that builds a user, a db, and a router for every file, including pure units.

**Correct:**
```ts
const test = base.extend({
  db: async ({}, use) => {
    const db = await makeDb();
    await use(db);
    await db.close();
  },
});
```

Notes: Keep the extended `test` next to the tests that need it. Do not force it on the whole suite.
