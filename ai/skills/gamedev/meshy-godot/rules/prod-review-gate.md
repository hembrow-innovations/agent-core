---
title: Human review before bake
impact: MEDIUM
impactDescription: bad silhouettes become shipped art debt
tags: [production, quality]
---

## Human review before bake

AI output is a draft. Topology holes, extra blobs, and style drift are cheaper to reject than to patch in Godot.

**Incorrect:** Auto-commit every `SUCCEEDED` GLB into `res://assets/production/`.

**Correct:** Staging folder. Check silhouette, internals, UVs, PBR under the game's `WorldEnvironment`, and scale against a reference dummy. Only then copy to the production path and instance.

Notes: The review is the production-grade step. Tooling should make reject/retry cheap (`iter-preview-spend`).
