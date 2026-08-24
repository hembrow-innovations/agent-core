---
title: Call/Connect use snake_case names
impact: CRITICAL
impactDescription: silent no-ops and failed connects
tags: [interop, csharp]
---

## Call/Connect use snake_case names

`Call`, `CallDeferred`, `Connect`, and similar string-based APIs expect **Godot snake_case** method/signal names—even from C#.

**Incorrect:**
```csharp
enemy.CallDeferred("AddChild", bullet); // looks for AddChild — wrong
button.Connect("Pressed", Callable.From(OnPressed)); // wrong signal name form
```

**Correct:**
```csharp
enemy.CallDeferred(Node.MethodName.AddChild, bullet);
// or: enemy.CallDeferred("add_child", bullet);

button.Pressed += OnPressed; // typed event preferred
// or: button.Connect(Button.SignalName.Pressed, Callable.From(OnPressed));
```

Notes: Custom GDScript methods use the name as defined (`snake_case` by convention). Prefer generated `MethodName`/`SignalName` over raw strings.

