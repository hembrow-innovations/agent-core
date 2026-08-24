---
title: Reduce per-frame C# allocations
impact: MEDIUM
impactDescription: GC spikes
tags: [perf, csharp]
---

## Reduce per-frame C# allocations

Avoid LINQ, per-frame arrays/lists, boxing, and string interpolation in `_Process`/`_PhysicsProcess`.

**Incorrect:**
```csharp
var nearby = GetTree().GetNodesInGroup("enemies").Cast<Node3D>().Where(...).ToList();
```

**Correct:** Reuse buffers; cache group queries; use loops; pool projectiles.

Notes: `params` arrays and captures also allocate.

