---
title: Signals across GDScript and C#
impact: CRITICAL
impactDescription: broken wiring is common
tags: [interop, signals]
---

## Signals across GDScript and C#

Both languages can emit/connect, but names and callables must match. Prefer editor connections or typed C# events when both ends are C#.

**Incorrect:** C# emits `HealthChanged` while GDScript connects to `"HealthChanged"` inconsistently; or connecting before the emitter enters the tree without care.

**Correct (C# define):**
```csharp
[Signal] public delegate void HealthChangedEventHandler(int current, int max);
// emit:
EmitSignal(SignalName.HealthChanged, current, max);
```

**Correct (GDScript connect):**
```gdscript
func _ready() -> void:
    $Player.health_changed.connect(_on_health_changed)
```

Notes: After adding C# signals, **Build** so the editor sees them. GDScript sees C# signals in snake_case.

