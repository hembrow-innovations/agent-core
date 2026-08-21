---
title: Don't leave empty process running
impact: HIGH
impactDescription: wasted frame time
tags: [lifecycle, perf]
---

## Don't leave empty process running

Idle nodes should not pay `_Process`/`_PhysicsProcess`. Toggle processing explicitly.

**Incorrect:** Every actor overrides `_Process` with early-return most frames.

**Correct:**
```csharp
public override void _Ready()
{
    SetProcess(false);
    SetPhysicsProcess(true);
}

public void StartAnim()
{
    SetProcess(true);
}
```

Notes: Prefer signals/timers over per-frame polls when possible.

