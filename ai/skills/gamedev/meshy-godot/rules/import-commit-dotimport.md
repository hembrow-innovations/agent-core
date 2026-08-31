---
title: Commit .import and reimport on replace
impact: HIGH
impactDescription: stale importer settings survive file swaps
tags: [import, git]
---

## Commit .import and reimport on replace

Godot stores importer options next to the GLB. Replacing bytes without reimport keeps old meshes/materials.

**Incorrect:** Gitignore `*.import`, or overwrite `model.glb` and expect tangents/LODs to refresh.

**Correct:** Commit `model.glb.import`. After replacing the GLB, reimport (click the file → Reimport, or delete `.godot/imported` for that asset). Keep generate-tangents and material mode stable across revisions.

Notes: Changing "Materials → Extract" mid-stream orphans extracted `.tres` files. Pick a mode per asset family and stick to it.
