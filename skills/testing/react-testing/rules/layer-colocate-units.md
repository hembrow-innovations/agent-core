---
title: Colocate unit tests with source
impact: CRITICAL
impactDescription: lost tests and wrong runners
tags: [layer, layout]
---

## Colocate unit tests with source

Match the repo's existing layout. Default: units next to the file or in a nearby `__tests__/`. Multi-surface E2E and non-UI integration stay in the repo's `e2e` / `tests` tree — not mixed with component units.

**Incorrect:** Dropping a component test into the Playwright folder, or putting a native screen test in the shared data package.

**Correct:** Copy a neighboring file of the same kind:

- Web primitive beside other UI tests
- Native screen beside the screen
- Hooks beside the data module
- Playwright / Maestro where those suites already live

Notes: Prefer the naming the repo already uses (`*.test.ts(x)` vs `*.spec.ts`). Do not invent a second convention in the same package.
