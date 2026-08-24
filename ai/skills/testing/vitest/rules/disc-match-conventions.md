---
title: Copy a neighboring test
impact: CRITICAL
impactDescription: new file that does not run
tags: [discover, conventions]
---

## Copy a neighboring test

Folder, suffix, imports, and mock style are already decided. A new file that invents `*.spec.tsx` next to `*.test.ts` is the next flake.

**Incorrect:** A new `src/foo.spec.tsx` that uses `globals: true` while every neighbor is `foo.test.ts` with explicit `vitest` imports.

**Correct:** Open one neighboring test. Copy its runner imports, folder, suffix, and mock altitude.

Notes: If neighbors disagree, follow the package you are editing, not another app in the monorepo.
