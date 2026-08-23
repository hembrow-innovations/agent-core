---
title: Use related and changed for tight loops
impact: MEDIUM
impactDescription: full suite when a slice would do
tags: [run, perf]
---

## Use related and changed for tight loops

Agents should not wait on the whole tree to check one file. Vitest can run tests that import a source file, or tests for dirty files.

**Incorrect:** `vitest run` after editing one helper, then waiting on 400 files.

**Correct:**
```bash
vitest related --run src/sum.ts
vitest run --changed
vitest run --changed origin/main
```

Notes: `related` only sees static imports. Pair with `--run` under lint-staged.
