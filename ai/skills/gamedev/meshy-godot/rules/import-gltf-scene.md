---
title: Import GLB as a glTF scene
impact: HIGH
impactDescription: Godot's unit of reuse is PackedScene
tags: [import, gltf]
---

## Import GLB as a glTF scene

Dropping a `.glb` into `res://` makes Godot import a scene (`Node3D` root, `MeshInstance3D` children, optional `Skeleton3D` / `AnimationPlayer`).

**Incorrect:** Parse GLB with a custom loader at runtime, or use `ImmediateMesh` from downloaded bytes in shipping builds.

**Correct:** Place `model.glb` under `res://assets/…`. Open it, confirm the tree, **Save As** a `.tscn` wrapper if you need gameplay nodes. Instance that.

Notes: Runtime `GLTFDocument.append_from_file` is for tools and mods, not the default ship path (`path-bake-glb`).
