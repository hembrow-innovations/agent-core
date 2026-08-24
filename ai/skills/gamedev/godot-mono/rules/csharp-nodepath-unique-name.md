---
title: Prefer unique names over brittle paths
impact: HIGH
impactDescription: resilient scene refs
tags: [csharp, scenes]
---

## Prefer unique names over brittle paths

Use scene unique names (`%HurtBox`) or exported `NodePath`/node refs instead of deep `GetNode("a/b/c")` chains.

**Incorrect:**
```csharp
var hb = GetNode<Area2D>("Body/Visual/HurtBox");
```

**Correct:**
```csharp
// node has unique name HurtBox in scene
var hb = GetNode<Area2D>("%HurtBox");
// or
[Export] public NodePath HurtBoxPath { get; set; }
```

Notes: Export node references when designers rewire scenes.

