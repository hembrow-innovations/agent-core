---
title: Use vi.fn and vi.spyOn
impact: HIGH
impactDescription: jest.fn in a Vitest file
tags: [mock]
---

## Use vi.fn and vi.spyOn

The mock API is `vi`. Jest globals are not there unless you asked for them.

**Incorrect:** `const fn = jest.fn(); jest.spyOn(api, "get");`

**Correct:**
```ts
import { expect, test, vi } from "vitest";
const getApples = vi.fn().mockReturnValue(10);
const spy = vi.spyOn(calculator, "add");
```

Notes: `vi.mocked(fn)` types a mocked export. Pass the implementation to `vi.fn(impl)` when you need one.
