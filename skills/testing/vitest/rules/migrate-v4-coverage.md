---
title: Fix coverage config on the v4 upgrade
impact: HIGH
impactDescription: missing files or removed keys
tags: [migrate, v4, coverage]
---

## Fix coverage config on the v4 upgrade

V8 remapping changed. `coverage.all` and `coverage.extensions` were removed. Reports will move.

**Incorrect:** Shipping v4 with the old `all: true` block and no `include`.

**Correct:** Delete `all` and `extensions`. Set `coverage.include` to source. Re-read the report before you move thresholds.

Notes: Empty lines are no longer counted. Thresholds may need a one-time reset.
