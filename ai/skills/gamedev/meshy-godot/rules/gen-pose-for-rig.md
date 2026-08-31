---
title: Generate characters in A or T pose
impact: HIGH
impactDescription: posed meshes fail auto-rig
tags: [generation, rigging]
---

## Generate characters in A or T pose

Auto-rig needs a readable biped. Action poses hide limbs and break pose estimation (HTTP 422).

**Incorrect:** "warrior mid-swing, dynamic pose" then `POST /openapi/v1/rigging`.

**Correct:** Text-to-3D `pose_mode: "a-pose"` or `"t-pose"`. Image refs in a similar bind pose. Rig after texture and remesh (`anim-rig-after-remesh`).

Notes: Empty `pose_mode` means no enforced bind pose. `is_a_t_pose` is deprecated.
