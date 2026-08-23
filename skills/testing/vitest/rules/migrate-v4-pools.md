---
title: Move poolOptions to the top level
impact: HIGH
impactDescription: isolation and worker caps ignored
tags: [migrate, v4]
---

## Move poolOptions to the top level

Tinypool is gone. `poolOptions`, `singleFork`, and `maxForks` do not apply.

**Incorrect:** `poolOptions: { forks: { isolate: false, singleFork: true } }`

**Correct:** `isolate: false` and `maxWorkers: 1`. Put `execArgv` at `test.execArgv`. Rename VM `memoryLimit` to `vmMemoryLimit`.

Notes: These options can now differ per project. See `isolate-max-workers`.
