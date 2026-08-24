---
title: Filter from the CLI, do not commit test.only
impact: CRITICAL
impactDescription: CI skips the suite or fails allowOnly
tags: [run, filter]
---

## Filter from the CLI, do not commit test.only

`test.only` is a landmine. Vitest can filter by file, line, name, tags, and project.

**Incorrect:** `test.only("adds", ...)` left in the tree. `allowOnly` is false in CI.

**Correct:**
```bash
vitest run src/sum.test.ts
vitest run src/sum.test.ts:12
vitest run -t "adds 1"
vitest run --project unit
vitest run --tagsFilter "unit && !slow"
```

Notes: Filename filter is a substring, not a glob. Line filter needs the full filename.
