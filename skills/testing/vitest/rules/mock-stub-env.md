---
title: Stub env with vi.stubEnv
impact: MEDIUM
impactDescription: process.env leaks across files
tags: [mock, env]
---

## Stub env with vi.stubEnv

Assigning `process.env.FOO` is sticky. `vi.stubEnv` pairs with `vi.unstubAllEnvs`.

**Incorrect:** `process.env.API_URL = "http://x";` with no cleanup.

**Correct:**
```ts
vi.stubEnv("API_URL", "http://x");
// ...
vi.unstubAllEnvs();
```

Notes: `vi.stubGlobal` is the same idea for `window` / `fetch`. Call `vi.unstubAllGlobals` in `afterEach` or set `unstubEnvs` / `unstubGlobals` in config.
