---
title: Prefer C# for systems and hot paths
impact: CRITICAL
impactDescription: types + perf where it matters
tags: [hybrid, csharp]
---

## Prefer C# for systems and hot paths

Choose C# for domain models, combat/AI/path systems, serialization-heavy logic, reusable libraries, and CPU-heavy loops that benefit from static typing and fewer dynamic lookups.

**Incorrect:** Large combat resolver in an untyped GDScript file growing past a few hundred lines with no seam.

**Correct:** C# service or node-owned system with a small public API; GDScript/scenes call into it.

Notes: Still attach C# at a clear node/autoload boundary—do not scatter static helpers with hidden tree dependencies.

