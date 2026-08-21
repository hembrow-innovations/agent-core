---
title: Define and emit C# signals
impact: HIGH
impactDescription: idiomatic events + GD interop
tags: [csharp, signals]
---

## Define and emit C# signals

Use `[Signal]` on a delegate ending with `EventHandler`. Emit via `EmitSignal(SignalName....)`.

**Incorrect:**
```csharp
public event Action<int> HealthChanged; // plain CLR event — not a Godot signal
```

**Correct:**
```csharp
[Signal]
public delegate void HealthChangedEventHandler(int current);

public void TakeHit(int dmg)
{
    // ...
    EmitSignal(SignalName.HealthChanged, _hp);
}
```

Notes: C# can also subscribe with `HealthChanged += Handler` for same-language typed events.

