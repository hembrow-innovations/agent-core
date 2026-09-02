---
title: Binaries via Git LFS
impact: HIGH
impactDescription: repo size control
tags: [pipeline, git]
---

## Binaries via Git LFS

Track blend/glb/fbx/png/wav via LFS patterns in `.gitattributes`. Keep total binary weight under control (~2GB class).

**Incorrect:** Commit multi-MB art as normal git blobs; commit `.godot/` import caches as SoT.

**Correct:** LFS-tracked binaries; commit stable `.import` sidecars with runtime copies when needed.
