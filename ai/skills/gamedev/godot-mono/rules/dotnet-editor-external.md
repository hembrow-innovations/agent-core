---
title: Use an external C# editor
impact: LOW
impactDescription: productivity
tags: [dotnet, editor]
---

## Use an external C# editor

Godot’s built-in C# editing is minimal. Use Rider or VS Code with C# extension; set **Editor Settings → Dotnet → Editor**.

**Incorrect:** Expecting full refactor/debug inside Godot’s script editor alone.

**Correct:** External IDE for C#; Godot for scenes/signals; Build in Godot after API changes.

Notes: Debug configs often need `GODOT4` env pointing at the mono editor binary.

