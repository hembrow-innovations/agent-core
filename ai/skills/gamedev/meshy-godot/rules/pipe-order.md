---
title: Remesh → UV → texture → rig → animate
impact: HIGH
impactDescription: later stages freeze earlier ones
tags: [pipeline, postprocess]
---

## Remesh → UV → texture → rig → animate

Meshy post-process is ordered. Rigging a 200k mess or texturing bad UVs bakes the defect in.

**Incorrect:** Rig the raw preview, then remesh (skeleton will not match). Texture, then unwrap (seams on a finished albedo).

**Correct:** Freeze shape (preview/standard) → remesh or smart-topology to budget → unwrap if you will hand-paint or saw seams → PBR texture/retexture → rig → animation library / text-to-motion → export GLB.

Notes: Skip UV unwrap when Meshy UVs are already clean and you will not paint. Skip rig for static props.
