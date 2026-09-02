---
title: Inspect scene before mutating
impact: CRITICAL
impactDescription: prevents destructive mistakes
tags: [mcp, safety]
---

## Inspect scene before mutating

Always read current objects/collections before rename, delete, or bulk apply.

**Incorrect:** `bpy.ops.object.delete()` on unknown selection; overwrite `Cube` without checking name collisions.

**Correct:** `get_scene_info` → `get_object_info` on targets → then mutate. Prefer explicit object name lookups over relying on selection state.

Notes: Selection is brittle across MCP calls; address objects by name.
