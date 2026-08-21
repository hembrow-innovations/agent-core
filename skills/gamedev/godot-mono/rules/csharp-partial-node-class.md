---
title: partial class matching filename
impact: CRITICAL
impactDescription: sourcegen + attach requirements
tags: [csharp]
---

## partial class matching filename

Godot C# scripts must be `partial` (source generators) and the **class name must match the `.cs` file name** when attached to a node.

**Incorrect:**
```csharp
// PlayerController.cs
public class Player : Node2D { } // not partial; name mismatch
```

**Correct:**
```csharp
// PlayerController.cs
using Godot;
public partial class PlayerController : Node2D { }
```

Notes: Missing `partial` breaks generated `SignalName`/`MethodName` and other bindings.

