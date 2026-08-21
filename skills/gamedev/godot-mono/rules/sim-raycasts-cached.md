---
title: Reuse physics query objects
impact: LOW
impactDescription: alloc churn
tags: [physics, perf]
---

## Reuse physics query objects

Don’t allocate new query parameters every frame if avoidable.

**Incorrect:** New `PhysicsRayQueryParameters3D` every `_PhysicsProcess` without reuse.

**Correct:** Create params once; update `From`/`To`/mask; query space state.

Notes: Cache `GetWorld3D().DirectSpaceState` lookups appropriately.

