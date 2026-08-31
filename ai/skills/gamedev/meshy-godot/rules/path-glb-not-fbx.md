---
title: Prefer GLB for Godot
impact: CRITICAL
impactDescription: Godot's native 3D interchange is glTF
tags: [pipeline, formats]
---

## Prefer GLB for Godot

Godot 4 imports glTF 2.0 / GLB natively (mesh, PBR, skeleton, animation). FBX is the Unity/Unreal default and a worse Godot path.

**Incorrect:** Export FBX "because the Meshy game-assets guide says FBX", then fight the Godot FBX importer.

**Correct:** Request `target_formats: ["glb"]` (or download `model_urls.glb`). Use Convert API only when another tool in the chain needs FBX/OBJ.

Notes: Meshy omits missing format keys. Check `model_urls.glb` exists before download.
