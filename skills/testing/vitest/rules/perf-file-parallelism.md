---
title: Disable fileParallelism only when order is required
impact: LOW
impactDescription: serial suite for no reason
tags: [perf]
---

## Disable fileParallelism only when order is required

Files run in parallel. Serial is for a shared resource you could not split.

**Incorrect:** `fileParallelism: false` at the root because one integration file is racy.

**Correct:** A sequential project that `include`s those files. Leave units parallel. Prefer unique temp dirs first (`isolate-no-shared-files`).

Notes: `sequence.shuffle.files` is for finding order bugs, not for everyday CI.
