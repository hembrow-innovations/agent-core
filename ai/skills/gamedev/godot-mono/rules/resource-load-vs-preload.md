---
title: preload/cache vs load
impact: MEDIUM
impactDescription: hitch reduction
tags: [resources]
---

## preload/cache vs load

`preload`/const loads bake dependencies; runtime `load`/`GD.Load` can hitch. Cache frequently used assets.

**Incorrect:** `load(path)` inside `_Process` or per-shot without cache.

**Correct:** Preload bullet scene; or load once into a static/cached field at startup.

Notes: Use background loading APIs for large streams.

