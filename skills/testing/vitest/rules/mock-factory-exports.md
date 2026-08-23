---
title: A mock factory must return the module object
impact: CRITICAL
impactDescription: default export swallowed, named exports missing
tags: [mock]
---

## A mock factory must return the module object

Jest factories that return a value become the default export. Vitest factories must return `{ default, ...named }`.

**Incorrect:** `vi.mock("./x", () => "hello")`

**Correct:**
```ts
vi.mock(import("./x.js"), () => ({
  default: "hello",
  named: vi.fn(),
}));
```

Notes: If a consumer reads a missing export, Vitest throws. List every export you need.
