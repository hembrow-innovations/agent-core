---
title: Call into C# nodes cleanly
impact: HIGH
impactDescription: reliable hybrid calls
tags: [gdscript, interop]
---

## Call into C# nodes cleanly

Prefer real methods on a known node over string calls. Match C# public method names as exposed to Godot (PascalCase methods are typically callable as-is from GDScript in Godot 4, but stay consistent with your project’s convention and test once).

**Incorrect:** Deep path + `call` with wrong arity and no null checks.

**Correct:**
```gdscript
@onready var combat: Node = %CombatSystem

func _on_attack_pressed() -> void:
    combat.try_attack(target)
```

Notes: If using `call`, pass the exact method name Godot registered; rebuild C# after renames.

