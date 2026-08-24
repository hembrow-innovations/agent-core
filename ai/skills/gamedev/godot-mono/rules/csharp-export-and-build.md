---
title: Rebuild after Export/signal changes
impact: CRITICAL
impactDescription: editor won't see new fields otherwise
tags: [csharp, editor]
---

## Rebuild after Export/signal changes

New `[Export]` properties, `[Signal]` delegates, and `[Tool]` behavior require rebuilding project assemblies (editor **Build** button).

**Incorrect:** Add `[Export] public float Speed { get; set; }`, expect Inspector to show it immediately without build.

**Correct:** Build after API surface changes; then set values in Inspector / `.tscn`.

Notes: Same for tool-scripts that must run in editor.

