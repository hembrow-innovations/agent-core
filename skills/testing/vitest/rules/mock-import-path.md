---
title: Pass import() to vi.mock
impact: HIGH
impactDescription: string path is untyped and misses renames
tags: [mock]
---

## Pass import() to vi.mock

`import("./db.js")` types the factory and `importOriginal`. A string does not. Vitest strips the dynamic import before run.

**Incorrect:** `vi.mock("./db.js", () => ({ getUser: vi.fn() }))`

**Correct:** `vi.mock(import("./db.js"), () => ({ getUser: vi.fn() }))`

Notes: Same for `vi.doMock` and `vi.unmock`.
