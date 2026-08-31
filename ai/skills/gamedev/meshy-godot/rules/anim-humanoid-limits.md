---
title: Auto-rig is humanoid only
impact: MEDIUM
impactDescription: 422 on non-bipeds
tags: [animation, rigging]
---

## Auto-rig is humanoid only

Programmatic rigging expects a textured biped with clear limbs. Creatures, props, and blobs fail pose estimation.

**Incorrect:** Rig a dragon, a chest, or a character with fused arms.

**Correct:** Humanoid only. Face along **+Z**. Set `height_meters` to the real height. Non-humanoids: skip Meshy rig, animate in Blender, or use Godot skeletons you author.

Notes: GLB only for `model_url`. 422 Unprocessable Entity = not a valid humanoid, not a retry-the-same case.
