---
title: Preview cheap, refine winners
impact: MEDIUM
impactDescription: refine and 4k texture burn credits
tags: [iteration, credits]
---

## Preview cheap, refine winners

Most generations are rejects. Spend on shape first.

**Incorrect:** Image-to-3d with `enable_pbr` + `texture_resolution: "4k"` + `ultra_mode` on every sketch.

**Correct:** Text-to-3d **preview** (or image-to-3d with `should_texture: false`) until the silhouette is right. Refine / PBR / 4k / remesh only the keepers. Check balance before a batch (`GET /openapi/v1/balance` conceptually — see docs).

Notes: HTTP 402 is empty credits. `ultra_mode` adds cost and time on meshy-7 preview only.
