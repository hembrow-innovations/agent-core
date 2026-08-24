---
title: Correct lifecycle override signatures
impact: HIGH
impactDescription: silent non-overrides
tags: [csharp, lifecycle]
---

## Correct lifecycle override signatures

Use the Godot 4 C# signatures. Wrong types mean you are **not** overriding.

**Incorrect:**
```csharp
public override void _Process(float delta) { } // should be double
```

**Correct:**
```csharp
public override void _Ready() { }
public override void _Process(double delta) { }
public override void _PhysicsProcess(double delta) { }
public override void _EnterTree() { }
public override void _ExitTree() { }
```

Notes: Enable overrides carefully; turn off processing when unused.

