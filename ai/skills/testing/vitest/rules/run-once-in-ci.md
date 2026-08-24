---
title: Use vitest run when the process must exit
impact: CRITICAL
impactDescription: watch hangs CI and agent loops
tags: [run, ci]
---

## Use vitest run when the process must exit

Bare `vitest` watches on a TTY. Agents and CI need a process that exits.

**Incorrect:** `vitest` or `pnpm test` that never returns in a non-CI TTY.

**Correct:** `vitest run`, or the project script if it already passes `--run`.

Notes: Watch is fine when the human asked to iterate locally. Default to `run` for agent work.
