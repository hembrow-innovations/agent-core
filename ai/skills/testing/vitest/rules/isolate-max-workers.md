---
title: Use maxWorkers, not maxThreads or maxForks
impact: MEDIUM
impactDescription: removed poolOptions in v4
tags: [isolate, v4]
---

## Use maxWorkers, not maxThreads or maxForks

`poolOptions.forks.maxForks` and `maxThreads` are gone. The knob is `maxWorkers`.

**Incorrect:** `poolOptions: { forks: { singleFork: true, maxForks: 1 } }`

**Correct:** `maxWorkers: 1` and `isolate: false` when you used to want `singleFork`. `execArgv` and `vmMemoryLimit` are top-level too.

Notes: `VITEST_MAX_WORKERS` replaced `VITEST_MAX_THREADS` / `VITEST_MAX_FORKS`.
