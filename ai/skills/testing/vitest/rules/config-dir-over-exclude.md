---
title: Prefer test.dir over a huge exclude list
impact: HIGH
impactDescription: v4 exclude is slim; dist tests start running
tags: [config, v4]
---

## Prefer test.dir over a huge exclude list

Vitest 4 only excludes `node_modules` and `.git` by default. `dist` and config files are no longer skipped. `test.dir` is cheaper than listing every junk folder.

**Incorrect:** Relying on old defaults, then watching `dist/**/*.test.js` run.

**Correct:** `test.dir: "./src"` or an explicit `include`. Restore old excludes only when `dir` cannot express them.

Notes: `configDefaults.exclude` still exists if you must restore the v3 list.
