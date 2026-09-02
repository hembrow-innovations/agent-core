---
title: Animation clip hygiene
impact: MEDIUM
impactDescription: playback correctness
tags: [export, animation]
---

## Animation clip hygiene

**Incorrect:** Unnamed actions; unapplied rig scale; constraints not baked.

**Correct:** Name `AN_<Clip>`; bake constraints; include armature + skinned mesh; sample ~30 fps default; re-check mesh Y-offset after first Godot play.
