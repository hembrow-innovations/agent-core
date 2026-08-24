---
title: Use class_name for typed refs
impact: MEDIUM
impactDescription: cleaner hybrid refs
tags: [gdscript]
---

## Use class_name for typed refs

Expose reusable GDScript types with `class_name` so other scripts (and the editor) can type them.

**Incorrect:** Duck-typed `node.has_method("foo")` everywhere for first-party types.

**Correct:**
```gdscript
class_name HealthComponent
extends Node
signal died
```

Notes: Still fine to duck-type optional plugins/addons.

