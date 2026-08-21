---
title: Preallocate StringName and NodePath
impact: HIGH
impactDescription: per-frame alloc/marshal
tags: [perf, csharp]
---

## Preallocate StringName and NodePath

Implicit `string` → `StringName`/`NodePath` conversions allocate and marshal. Create once.

**Incorrect:**
```csharp
public override void _Process(double delta)
{
    GetNode("Sprite2D").Set("modulate", Colors.White); // strings every frame
}
```

**Correct:**
```csharp
private static readonly NodePath SpritePath = "Sprite2D";
// or cached node ref from _Ready
private Node2D _sprite;
public override void _Ready() => _sprite = GetNode<Node2D>("%Sprite");
```

Notes: Use `MethodName`/`PropertyName` constants.

