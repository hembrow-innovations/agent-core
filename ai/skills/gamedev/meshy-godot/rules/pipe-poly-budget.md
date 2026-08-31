---
title: Hit a platform poly budget
impact: HIGH
impactDescription: raw Meshy meshes are too dense for realtime
tags: [pipeline, performance]
---

## Hit a platform poly budget

Godot pays for vertices every frame. Meshy defaults (~30k, or much higher without remesh) are a starting sculpt, not a mobile prop.

**Incorrect:** Drop an un-remeshed meshy-7 preview into a phone scene.

**Correct:** Remesh `target_polycount` (or smart-topology) to the budget, then import. Rough targets:

- **Mobile casual**: characters 3–5k, props 0.5–2k, env 1–5k
- **PC**: characters 20–50k, props 5–15k, env 10–50k
- **VR**: between mobile AAA and PC

Notes: Range 100–300000 on Remesh. Adaptive `decimation_mode` 1–4 overrides `target_polycount`. Measure in Godot's debugger, not Meshy's estimate.
