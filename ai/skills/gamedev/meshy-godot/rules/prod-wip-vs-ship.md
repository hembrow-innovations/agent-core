---
title: Separate WIP dumps from shipped assets
impact: MEDIUM
impactDescription: plugin imports pollute gameplay scenes
tags: [production, git]
---

## Separate WIP dumps from shipped assets

Bridge drops models into the open scene. That is a sketch. Production assets need a stable `res://` path.

**Incorrect:** Leave Bridge imports parented under the main scene and commit it.

**Correct:** `res://assets/meshy/wip/` gitignored or LFS-ignored. Promote to `res://assets/<set>/<slug>/` with sidecar + `.import` after review. Gameplay scenes only instance production slugs.

Notes: Stable paths keep PackedScene references valid across regenerations (`import-instance-packed`).
