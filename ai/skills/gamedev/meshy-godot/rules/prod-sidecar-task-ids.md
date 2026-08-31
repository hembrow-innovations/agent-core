---
title: Record Meshy task ids beside the GLB
impact: MEDIUM
impactDescription: regeneration without provenance is guesswork
tags: [production, metadata]
---

## Record Meshy task ids beside the GLB

You will re-run remesh/retexture. The GLB does not remember the prompt.

**Incorrect:** Filename `meshy_final2.glb` with the prompt lost in chat history.

**Correct:** Sidecar `model.json` (or a custom Resource) with prompt, `ai_model`, preview/refine/remesh/retexture/rig task ids, polycount, texture resolution, and date. Commit it with the GLB.

Notes: Task ids are for regeneration, not runtime loading (`path-bake-glb`).
