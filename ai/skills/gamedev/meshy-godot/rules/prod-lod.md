---
title: Add LODs or visibility ranges
impact: MEDIUM
impactDescription: one high mesh at all distances wastes GPU
tags: [production, lod]
---

## Add LODs or visibility ranges

A hero remesh at 20k is fine up close. Ten of them at 80 m is not.

**Incorrect:** One Meshy mesh, no importer LODs, no `visibility_range_end`.

**Correct:** Enable Generate LODs on the glTF importer, **or** remesh 2–3 variants and swap with `MeshInstance3D` visibility ranges / `GeometryInstance3D` range fades.

Notes: LOD0 = ship budget. LOD1 ≈ 40–50%. LOD2 = billboard or 10%. Do not generate LODs from an already 1k prop.
