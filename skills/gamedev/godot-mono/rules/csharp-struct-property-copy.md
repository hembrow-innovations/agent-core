---
title: Reassign Godot struct properties
impact: CRITICAL
impactDescription: CS1612 / silent no-ops
tags: [csharp, pitfall]
---

## Reassign Godot struct properties

Properties like `Position`, `Scale`, `GlobalTransform` return **structs**. Mutating a field of the copy does nothing unless reassigned.

**Incorrect:**
```csharp
Position.X = 100f; // CS1612 or ineffective
```

**Correct:**
```csharp
Position = Position with { X = 100f };
// or
var p = Position; p.X = 100f; Position = p;
```

Notes: Applies broadly to `Vector2/3`, `Transform2D/3D`, `Color`, etc.

