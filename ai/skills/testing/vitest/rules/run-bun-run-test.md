---
title: Use bun run test, not bun test
impact: HIGH
impactDescription: Bun runs its own runner
tags: [run, bun]
---

## Use bun run test, not bun test

`bun test` is Bun's runner. It will not load `vitest.config` or `vi`.

**Incorrect:** `bun test`

**Correct:** `bun run test` so the package script starts Vitest.

Notes: Same trap exists for `deno test`. Call the script, not the runtime verb.
