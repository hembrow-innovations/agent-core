---
title: await ToSignal in C#
impact: MEDIUM
impactDescription: async without busy loops
tags: [async, csharp]
---

## await ToSignal in C#

Bridge Godot signals into C# async with `await ToSignal(...)`. Don’t spin `_Process` waiting.

**Incorrect:**
```csharp
while (!done) { await Task.Delay(1); } // fights the game loop
```

**Correct:**
```csharp
await ToSignal(GetTree().CreateTimer(0.5), SceneTreeTimer.SignalName.Timeout);
await ToSignal(anim, AnimationPlayer.SignalName.AnimationFinished);
```

Notes: Guard against nodes freeing while awaiting; check `IsInstanceValid`.

