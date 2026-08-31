---
title: 3D Agent for style-consistent batches
impact: MEDIUM
impactDescription: chat batches beat N unrelated API calls
tags: [iteration, webapp]
---

## 3D Agent for style-consistent batches

The webapp 3D Agent keeps conversation context and can propose a set. The REST generate endpoints do not.

**Incorrect:** 12 isolated API previews with slightly different adjectives, hoping they match.

**Correct:** For a new set, start in 3D Agent ("cyberpunk RPG props, six variations"). Pick winners, then Bridge or API-download those task outputs into Godot. Use the same bible for later API fills.

Notes: Agent is a webapp product, not a Godot runtime. Still bake GLB (`path-bake-glb`).
