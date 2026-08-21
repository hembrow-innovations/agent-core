---
title: Move proven hot loops to C#
impact: MEDIUM
impactDescription: measure first
tags: [perf, hybrid]
---

## Move proven hot loops to C#

GDScript is fine for most gameplay. Move to C# after profiling shows a hotspot—not by default.

**Incorrect:** Rewrite entire game in C# because “C# is faster.”

**Correct:** Profile → identify bottleneck (pathfinding, FOV, inventory sim) → implement that module in C# behind a stable API.

Notes: Interop chatter can erase gains if you call C# every frame per entity with huge marshalled payloads.

