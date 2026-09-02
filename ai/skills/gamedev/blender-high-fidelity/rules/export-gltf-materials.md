---
title: glTF-safe materials only
impact: HIGH
impactDescription: shader survival
tags: [export, materials]
---

## glTF-safe materials only

**Incorrect:** Blender-only nodes (Sheen hacks, proprietary groups) that bake to pink/black in Godot.

**Correct:** Principled BSDF metallic-roughness; pack ORM if needed; test one import in Godot after first material pass.
