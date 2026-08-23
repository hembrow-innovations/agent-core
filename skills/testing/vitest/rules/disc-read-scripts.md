---
title: Read scripts and deps first
impact: CRITICAL
impactDescription: wrong runner or invented command
tags: [discover, scripts]
---

## Read scripts and deps first

The repo already chose a runner and a gate. Guessing `pnpm test` or adding Vitest next to Jest wastes the first hour.

**Incorrect:**
```bash
pnpm test
npx vitest run
```
when the package has no `test` script, or the monorepo gate is `pnpm --filter api test`.

**Correct:** Read root and package `package.json`, justfile, and CI. Run the script that package already exposes.

Notes: Typical shapes: `pnpm test`, `pnpm --filter <pkg> test`, `npx vitest run`. Prefer the first one that exists.
