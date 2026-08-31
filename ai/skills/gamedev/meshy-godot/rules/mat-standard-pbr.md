---
title: Map Meshy PBR onto StandardMaterial3D
impact: MEDIUM
impactDescription: wrong slots look lit twice or fully plastic
tags: [materials, pbr]
---

## Map Meshy PBR onto StandardMaterial3D

Godot's default 3D material is `StandardMaterial3D`. Meshy PBR is albedo + normal + roughness + metallic (emission only on some meshy-6 outputs).

**Incorrect:** Leave the importer on unshaded, or plug roughness into emission. Or keep baked lighting in albedo and add a strong `WorldEnvironment`.

**Correct:** Albedo → albedo (sRGB). Normal → normal map. Roughness → roughness. Metallic → metallic. Disable unshaded. Let the scene light the mesh.

Notes: If you extract materials, commit the `.tres`. ORMMaterial3D is optional — pack occlusion/roughness/metallic only if the project already uses ORM.
