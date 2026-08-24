---
title: Use MethodName/SignalName/PropertyName
impact: CRITICAL
impactDescription: fewer allocs, fewer typos
tags: [interop, csharp, perf]
---

## Use MethodName/SignalName/PropertyName

Prefer source-generated name constants over literal strings for engine and your `[Signal]` APIs.

**Incorrect:**
```csharp
Connect("health_changed", Callable.From(OnHealthChanged));
Set("position", pos);
```

**Correct:**
```csharp
Connect(SignalName.HealthChanged, Callable.From(OnHealthChanged));
// engine:
Set(Node2D.PropertyName.Position, pos);
CallDeferred(MethodName.Setup);
```

Notes: Reduces `StringName` allocations and snake_case mistakes.

