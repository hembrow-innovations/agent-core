---
title: Tool scripts need rebuild + editor safety
impact: MEDIUM
impactDescription: editor crashes and stale code
tags: [csharp, tool]
---

## Tool scripts need rebuild + editor safety

`[Tool]` C# runs in the editor. Guard runtime-only logic; rebuild after changes; avoid destructive file ops in editor callbacks.

**Incorrect:** `[Tool]` script deletes files or assumes game singletons exist during edit.

**Correct:**
```csharp
[Tool]
public partial class Prop : Node3D
{
    public override void _Ready()
    {
        if (Engine.IsEditorHint()) { /* editor preview only */ return; }
        // runtime
    }
}
```

Notes: Hot reload limitations are harsher for tool scripts.

