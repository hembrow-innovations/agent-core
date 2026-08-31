---
title: Collision is not the render mesh
impact: MEDIUM
impactDescription: trimesh-on-render kills physics
tags: [production, physics]
---

## Collision is not the render mesh

Meshy meshes are dense and noisy. Using them as physics shapes is expensive and jittery.

**Incorrect:** `create_trimesh_collision()` on the imported `MeshInstance3D` for a moving actor.

**Correct:** Wrapper `StaticBody3D` / `CharacterBody3D` with a **simplified** `CollisionShape3D` (box, capsule, convex hull of a decimated copy). Keep the Meshy mesh visual-only.

Notes: Trimesh is static-only in Godot and still costly. Never convex-decompose a 40k organic mesh without a budget.
