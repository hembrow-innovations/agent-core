---
title: Prefer vertex color + simple PBR
impact: MEDIUM
impactDescription: farm-zoom read
tags: [mat, vertex-color]
---

## Prefer vertex color + simple PBR

Dense painted detail dies at farm zoom.

**Incorrect:** 4k unique albedo for a fence post.

**Correct:** Vertex color strips for planks/soil variation; small atlases on characters (512–1k).
