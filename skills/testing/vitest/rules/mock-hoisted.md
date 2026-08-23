---
title: Put mock variables in vi.hoisted
impact: CRITICAL
impactDescription: factory closes over a TDZ binding
tags: [mock]
---

## Put mock variables in vi.hoisted

`vi.mock` is hoisted above imports. A `const mockFn = vi.fn()` declared later is in the temporal dead zone when the factory runs.

**Incorrect:**
```ts
const getUser = vi.fn();
vi.mock(import("./db.js"), () => ({ getUser }));
```

**Correct:**
```ts
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock(import("./db.js"), () => ({ getUser }));
```

Notes: Or declare the `vi.fn()` inside the factory and `vi.mocked(getUser)` after import.
