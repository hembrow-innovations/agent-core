---
title: Bind callables carefully
impact: MEDIUM
impactDescription: leaks and wrong arity
tags: [signals]
---

## Bind callables carefully

Use binds for extra args. In C#, prefer method groups over anonymous lambdas when you must disconnect later.

**Incorrect:**
```csharp
button.Pressed += () => OnPressed(itemId); // hard to unsubscribe
```

**Correct:**
```csharp
// GDScript
button.pressed.connect(_on_pressed.bind(item_id))

// C# — store callable or use named handler map when dynamic
```

Notes: Mismatched signal arity fails at connect/emit time.

