---
title: Put slow typecheck in its own project
impact: LOW
impactDescription: unit feedback waits on tsc
tags: [types, perf]
---

## Put slow typecheck in its own project

Typecheck spawns `tsc`. Mixing it into the default project makes every `vitest run` wait.

**Incorrect:** `typecheck: { enabled: true }` on the only project, then wondering why units take 40s.

**Correct:** A `typecheck` project or a separate `pnpm test:types` that calls `vitest --typecheck.only`.

Notes: `typecheck.tsconfig` should point at the test tsconfig, not the app build.
