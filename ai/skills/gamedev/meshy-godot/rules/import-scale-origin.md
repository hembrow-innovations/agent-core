---
title: Normalize scale and origin
impact: HIGH
impactDescription: Meshy size is not Godot gameplay size
tags: [import, scale]
---

## Normalize scale and origin

Meshy output is roughly meters but not gameplay-calibrated. Characters should be ~1.6–2.0 m; origin should sit on the floor for props that rest, or at the pivot you will rotate.

**Incorrect:** Instance raw GLB at `(0,0,0)` scale `1` and discover a 12 m mug or a character floating above `CharacterBody3D`.

**Correct:** After import, check AABB. Use Meshy Resize API (`height_meters`) **or** a wrapper `Node3D` scale — prefer Resize so collision and animation stay consistent. Put feet/bottom on y=0.

Notes: Rigging `height_meters` default is 1.7. glTF forward is +Z; Meshy rigging requires the face along +Z.
