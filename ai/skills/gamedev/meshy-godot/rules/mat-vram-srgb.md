---
title: VRAM-compress; sRGB on albedo only
impact: MEDIUM
impactDescription: linear/sRGB mix breaks PBR
tags: [materials, import]
---

## VRAM-compress; sRGB on albedo only

Albedo is color. Normal/roughness/metallic are data. Compressing them as sRGB or leaving everything uncompressed wastes VRAM or hues.

**Incorrect:** Import all maps as `VRAM Compressed` + sRGB. Or leave lossless PNG on a mobile pack.

**Correct:** Albedo: VRAM compressed, sRGB. Normal: VRAM compressed, **not** sRGB, detect as normal map. Roughness/metallic: VRAM compressed, not sRGB.

Notes: Godot 4 Basis Universal / S3TC/BPTC/ETC2 follows the export preset. Do not hand-edit imported `.ctex` files.
