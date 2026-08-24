---
title: Native addons need forks
impact: CRITICAL
impactDescription: segfault, panic, Abort trap
tags: [isolate]
---

## Native addons need forks

Many native modules are not thread-safe. Threads produce `Segmentation fault` and `Abort trap: 6`.

**Incorrect:** `pool: "threads"` in a package that loads a native addon.

**Correct:** `pool: "forks"` (the default). Confirm by running the file that imports the addon.

Notes: If you see those crashes after setting threads, switch back before touching the test.
