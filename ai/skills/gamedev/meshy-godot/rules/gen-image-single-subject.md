---
title: One subject per image
impact: HIGH
impactDescription: image_too_complex kills scene-level inputs
tags: [generation, image-to-3d]
---

## One subject per image

Image-to-3D (`POST /openapi/v1/image-to-3d`) wants a single centered object. Piles, buildings, lattices, and multi-object shots fail as `image_too_complex`.

**Incorrect:** A screenshot of a whole room, a crate of fruit, or "cyberpunk city block" as the image.

**Correct:** Isolated object, front-facing, simple background. JPG/PNG URL or data URI. `should_texture: true`, `enable_pbr: true` for Godot.

Notes: Multi-view of the **same** object is `multi-image-to-3d`, not extra objects in one frame. Crop before upload.
