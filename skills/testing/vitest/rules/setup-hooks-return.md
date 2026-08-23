---
title: A value returned from beforeEach is teardown
impact: HIGH
impactDescription: Pinia or server treated as cleanup
tags: [setup]
---

## A value returned from beforeEach is teardown

Vitest treats a function returned from `beforeEach` / `beforeAll` as teardown. Jest did not.

**Incorrect:** `beforeEach(() => setActivePinia(createTestingPinia()))`

**Correct:** `beforeEach(() => { setActivePinia(createTestingPinia()); })`

Notes: Default hook order is a stack (`sequence.hooks`). Set `sequence.hooks: "list"` for Jest's sequential order.
