---
title: __mocks__ is not auto-loaded
impact: HIGH
impactDescription: Jest habit, live module in tests
tags: [mock]
---

## __mocks__ is not auto-loaded

Jest loads `<root>/__mocks__/x` automatically. Vitest only loads it when `vi.mock` is called for that module.

**Incorrect:** Dropping `__mocks__/fs.ts` and expecting every file to use it.

**Correct:** `vi.mock(import("node:fs"))` in the test, or once in `setupFiles` if every file needs it.

Notes: A factory argument wins over the `__mocks__` file.
