---
title: Collision ≠ render mesh
impact: MEDIUM-HIGH
impactDescription: physics stability
tags: [coll]
---

## Collision ≠ render mesh

**Incorrect:** Using LOD0 render mesh as physics collider by default.

**Correct:** Box/capsule/sphere/convex proxies slightly smaller than visual; no materials on collision meshes; watertight convex pieces.
