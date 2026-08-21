---
title: Prefer GDScript for scene glue
impact: CRITICAL
impactDescription: faster iteration, less rebuild friction
tags: [hybrid, gdscript]
---

## Prefer GDScript for scene glue

Use GDScript for thin node scripts, UI wiring, animation callbacks, and one-off scene behavior. It hot-reloads lightly and matches editor workflows.

**Incorrect:** C# script on every Label/Button only to connect a pressed signal.

**Correct:** GDScript (or editor signal connections) for UI glue; C# for the system the UI calls into.

Notes: If a script is mostly `@onready` refs + signal forwards, keep it GDScript.

