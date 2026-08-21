---
title: Put data in Resources
impact: MEDIUM
impactDescription: data/behavior split
tags: [resources]
---

## Put data in Resources

Balance stats, item defs, and wave tables belong in `Resource` (`.tres`/`.res`), not giant exported dicts on nodes.

**Incorrect:** Player node exports 50 balance numbers duplicated per instance.

**Correct:** `Stats.cs` / `stats.gd` Resource; nodes export `Stats stats`.

Notes: C#: `public partial class Stats : Resource`. GDScript: `class_name Stats extends Resource`.

