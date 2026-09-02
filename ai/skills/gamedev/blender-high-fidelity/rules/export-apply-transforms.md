---
title: Apply transforms on export set
impact: CRITICAL
impactDescription: correct scale in Godot
tags: [export, transform]
---

## Apply transforms on export set

**Incorrect:** Unapplied scale 0.01; rotated roots fighting Godot importer.

**Correct:** Location/rotation as authored; scale 1,1,1 on export objects; consistent forward with existing kits (+Z character forward unless kit differs — match neighbors).
