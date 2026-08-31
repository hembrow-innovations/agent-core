---
title: Smart topology for game meshes
impact: HIGH
impactDescription: cleaner faces, natively separated parts
tags: [generation, topology]
---

## Smart topology for game meshes

`model_type: "smart-topology"` (`meshy-t2`) builds game-like triangle meshes at `target_polycount`. Use it for props and characters that will render in Godot, not for sculpt previews.

**Incorrect:** Default `standard` at 100k+ faces dropped raw into a mobile scene.

**Correct:** `model_type: "smart-topology"`, `ai_model: "meshy-t2"`, `target_polycount` in budget (`pipe-poly-budget`). Skip `should_remesh` — it is ignored.

Notes: Smart topology is triangle-only; `topology: quad` errors. `lowpoly` is deprecated. Hero sculpts can stay `standard` then Remesh.
