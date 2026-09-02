---
title: One asset_id one folder
impact: CRITICAL
impactDescription: findable mesh SoT
tags: [pipeline, fs]
---

## One asset_id one folder

Every distinct mesh lives in its own folder under `assets/`.

**Incorrect:** `assets/meshes/ballista.glb` next to unrelated textures; dumping multiple props in one folder.

**Correct:**

```
assets/environment/towers/ballista/ballista.blend
assets/environment/towers/ballista/ballista.glb
assets/entities/characters/player_fox/player_fox.blend
assets/entities/enemies/vertical_slice/crop_eater/crop_eater.blend
```

Notes: Roots: `entities/characters`, `entities/enemies/<block_id>`, `environment`. Bare `entities/` is invalid.
