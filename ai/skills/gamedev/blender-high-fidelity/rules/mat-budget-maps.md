---
title: Texture budget discipline
impact: MEDIUM
impactDescription: memory + style
tags: [mat, textures]
---

## Texture budget discipline

**Incorrect:** Unique 4k hero maps on every prop; emissive everywhere.

**Correct:** Shared families; emissive only for lantern/eye needs; create `textures/` lazily when maps exist.
