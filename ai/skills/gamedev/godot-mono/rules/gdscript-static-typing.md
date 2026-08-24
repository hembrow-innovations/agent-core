---
title: Type GDScript at boundaries
impact: MEDIUM
impactDescription: errors earlier
tags: [gdscript]
---

## Type GDScript at boundaries

Use static types on parameters/returns that touch C# nodes, autoloads, and public APIs.

**Incorrect:**
```gdscript
func apply(target, amount):
    target.take_damage(amount)
```

**Correct:**
```gdscript
func apply(target: Node, amount: int) -> void:
    target.call("take_damage", amount)  # or typed method if class_name known
```

Notes: `class_name` on GDScript and C# `partial` classes improve editor assistance.

