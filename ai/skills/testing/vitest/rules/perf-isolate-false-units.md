---
title: Turn isolate off only on a cheap unit project
impact: LOW
impactDescription: module cache leaks across files
tags: [perf]
---

## Turn isolate off only on a cheap unit project

`isolate: false` plus `maxWorkers: 1` is the old `singleFork`. It is faster and shares module state.

**Incorrect:** `isolate: false` on the whole repo, including tests that `vi.mock` different graphs.

**Correct:** A `unit` project with `isolate: false` for pure functions. Keep isolate on for anything that mocks modules or writes files.

Notes: If tests relied on a reset between files, add `vi.resetModules()` in `beforeAll` via `setupFiles`.
