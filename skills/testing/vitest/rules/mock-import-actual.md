---
title: Use importOriginal or vi.importActual
impact: HIGH
impactDescription: jest.requireActual does not exist
tags: [mock]
---

## Use importOriginal or vi.importActual

Partial mocks need the real module. The factory helper is `importOriginal`. The standalone helper is `vi.importActual`.

**Incorrect:** `const { cloneDeep } = jest.requireActual("lodash/cloneDeep")`

**Correct:**
```ts
vi.mock(import("./mod.js"), async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, answer: vi.fn(actual.answer) };
});
```

Notes: `importOriginal` is async. Await it. Prefer `vi.spyOn` when you only need one export tracked.
