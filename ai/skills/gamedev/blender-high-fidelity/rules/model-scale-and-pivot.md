---
title: Scale 1 and correct pivots
impact: HIGH
impactDescription: Godot placement
tags: [model, transform]
---

## Scale 1 and correct pivots

Apply scale before boolean/export. Pivots:

| Kind | Pivot |
| ------ | ------- |
| Characters/enemies | Ground between feet; forward +Z (match kits) |
| Towers/home/pen | Ground center footprint |
| Crops | Ground center bed |
| Tools | Grip point |

**Incorrect:** Scale 0.01 leftovers; pivot at mesh AABB center floating above ground.

**Correct:** `scale=(1,1,1)`, origin at documented pivot, floor contact verified.
