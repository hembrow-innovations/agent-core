---
title: Instance a PackedScene, do not edit the dump
impact: HIGH
impactDescription: the next reimport wipes scene edits on the GLB
tags: [import, scenes]
---

## Instance a PackedScene, do not edit the dump

Edits on the imported GLB scene (scripts, collision, groups) vanish on reimport.

**Incorrect:** Attach `player.gd` and a `CollisionShape3D` directly on `model.glb`'s root in the imported scene.

**Correct:** Inherited scene or a thin `.tscn` that instances the GLB, then add gameplay nodes on the wrapper. Keep Meshy dumps read-only.

Notes: Unique names (`%Hitbox`) live on the wrapper so they survive mesh swaps.
