---
title: Defer tree-dependent setup
impact: HIGH
impactDescription: avoids 'parent busy' errors
tags: [lifecycle]
---

## Defer tree-dependent setup

Adding children, changing owners, or querying physics during sensitive callbacks often needs `CallDeferred`.

**Incorrect:**
```csharp
public override void _Ready()
{
    GetParent().AddChild(new Node()); // can fail depending on phase
}
```

**Correct:**
```csharp
public override void _Ready()
{
    CallDeferred(MethodName.FinishSetup);
}

private void FinishSetup() { /* safe modifications */ }
```

Notes: Same pattern in GDScript with `call_deferred`.

