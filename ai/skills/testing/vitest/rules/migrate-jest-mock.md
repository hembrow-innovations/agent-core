---
title: Rewrite Jest mock factories and requireActual
impact: HIGH
impactDescription: default export wrong, actual import missing
tags: [migrate, jest]
---

## Rewrite Jest mock factories and requireActual

Jest factory return value is the default export. `requireActual` is CommonJS. Vitest is ESM.

**Incorrect:** `jest.mock("./x", () => "hello")` and `jest.requireActual("./x")`.

**Correct:** `vi.mock(import("./x.js"), () => ({ default: "hello" }))` and `await vi.importActual("./x.js")`.

Notes: `jest.setTimeout` becomes `vi.setConfig({ testTimeout })`. `JEST_WORKER_ID` becomes `VITEST_POOL_ID`.
