---
title: Do not share writable files across tests
impact: HIGH
impactDescription: cross-file flakes under parallelism
tags: [isolate]
---

## Do not share writable files across tests

Files run in parallel by default. Two tests writing `./tmp/out.json` will clobber each other even with per-file isolate.

**Incorrect:** Every integration test writes `./.tmp/db.sqlite`.

**Correct:** A temp dir per test (`mkdtempSync`) or a unique name from `expect.getState().testPath`. Serialise only the project that must share a file (`fileParallelism: false`).

Notes: See `perf-file-parallelism`. Isolation of modules is not isolation of the disk.
