---
title: Run the project's test script
impact: CRITICAL
impactDescription: wrong flags, wrong package
tags: [run]
---

## Run the project's test script

Scripts already pin config path, projects, and coverage. A raw `npx vitest` from the repo root can pick the wrong config.

**Incorrect:** `npx vitest` at the monorepo root with no filter.

**Correct:** `pnpm --filter api test` or the `just` / npm script that package documents.

Notes: If you must call the binary, pass `-c` to the config you found.
