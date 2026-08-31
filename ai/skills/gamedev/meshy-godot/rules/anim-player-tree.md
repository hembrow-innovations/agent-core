---
title: AnimationTree for production characters
impact: MEDIUM
impactDescription: autoplay clips are not a locomotion system
tags: [animation, godot]
---

## AnimationTree for production characters

The plugin preserves clips and an `AnimationPlayer`. That is enough to preview. Gameplay needs blending, states, and root-motion control.

**Incorrect:** Leave importer autoplay on, or call `play("walk")` from `_process` with no blend.

**Correct:** Wrapper scene with `AnimationTree` (state machine or blend tree) driving the imported `AnimationPlayer`. Turn autoplay **off**. Keep clip names stable when replacing GLBs.

Notes: Meshy animation library uses `action_id` values. Map those names once in the tree. Plugin play-button preview is editor-only.
