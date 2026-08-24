---
title: Forgetting partial on Godot classes
impact: CRITICAL
impactDescription: generator breakage
tags: [pitfall, csharp]
---

## Forgetting partial on Godot classes

Without `partial`, Godot source generators cannot extend your type—signals/names break in confusing ways.

**Incorrect:** `public class Enemy : Node3D`

**Correct:** `public partial class Enemy : Node3D`

Notes: First check when SignalName is missing.

