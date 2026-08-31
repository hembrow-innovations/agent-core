---
title: Rig after topology is frozen
impact: MEDIUM
impactDescription: remesh after bind destroys weights
tags: [animation, rigging]
---

## Rig after topology is frozen

Rigging binds vertices to bones. A later remesh changes vertex count; weights will not transfer.

**Incorrect:** Rig the 80k preview, then remesh to 8k for mobile.

**Correct:** Remesh (or smart-topology) to the **ship** polycount, texture, then `POST /openapi/v1/rigging`. Then apply animation.

Notes: Meshy refuses `input_task_id` rigs over **300k faces**. Untextured meshes are not suitable.
