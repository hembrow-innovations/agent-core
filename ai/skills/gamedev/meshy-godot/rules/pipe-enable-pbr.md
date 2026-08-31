---
title: Enable PBR for Godot lighting
impact: HIGH
impactDescription: albedo-only looks painted-on under WorldEnvironment
tags: [pipeline, pbr]
---

## Enable PBR for Godot lighting

`enable_pbr` defaults **false**. Without it you get base color only. Godot's StandardMaterial3D expects metallic / roughness / normal.

**Incorrect:** Refine or image-to-3d with default flags, then wonder why the mesh is plastic in a lit scene.

**Correct:** `enable_pbr: true` on refine, image-to-3d, and retexture. Map those textures in Godot (`mat-standard-pbr`).

Notes: meshy-6 may emit; meshy-7 / `latest` do not. Do not set both `texture_prompt` and `texture_image_url` — prompt wins.
