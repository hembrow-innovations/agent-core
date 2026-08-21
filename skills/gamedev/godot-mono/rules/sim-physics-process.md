---
title: Gameplay forces in physics tick
impact: MEDIUM
impactDescription: determinism/stability
tags: [physics]
---

## Gameplay forces in physics tick

Movement that interacts with physics bodies belongs in `_PhysicsProcess` with fixed step, not `_Process`.

**Incorrect:** `MoveAndSlide` in `_Process` with render delta only.

**Correct:** Apply input-driven physics in `_PhysicsProcess(double delta)`.

Notes: Visual-only interpolation can stay in `_Process`.

