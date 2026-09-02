---
title: Execute bpy in small verified steps
impact: CRITICAL
impactDescription: debuggable MCP sessions
tags: [mcp, bpy]
---

## Execute bpy in small verified steps

Break work into short `execute_blender_code` chunks with verification between them.

**Incorrect:** One 200-line script that builds mesh, UVs, materials, export, and cleanup with no checkpoints.

**Correct:** Setup collections → blockout → screenshot → refine → cleanup → export. After each major step, query polycount/AABB or take a viewport screenshot.

Notes: On error, fix the last step only; do not restart the whole asset unless the scene is corrupted.
