---
title: InputMap actions over raw keys
impact: MEDIUM
impactDescription: rebinding and pads
tags: [input]
---

## InputMap actions over raw keys

Use input actions for gameplay. Reserve raw key checks for debug.

**Incorrect:** `Input.IsKeyPressed(Key.Space)` for jump in shipping logic.

**Correct:** `Input.IsActionJustPressed("jump")` with actions defined in project settings.

Notes: Same action names from GDScript and C#.

