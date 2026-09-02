---
title: Confirm Blender MCP before modeling
impact: CRITICAL
impactDescription: blocks all mesh work
tags: [mcp, setup]
---

## Confirm Blender MCP before modeling

Drive Blender through MCP on **localhost:9876**. Do not invent geometry offline and paste untested dumps.

**Incorrect:** Assume Blender is connected; run long `bpy` scripts blind.

**Correct:** Call status/scene tools first (`get_addon_status` / `get_scene_info`). If disconnected, stop and tell the human to enable BlenderMCP (port 9876) and restart Pi if MCP was just added to `.mcp.json`.

Notes: `.mcp.json` `blender` uses `uvx blender-mcp` with `BLENDER_PORT=9876`. Godot Beckett is a separate MCP (8770). Lean parents spawn `blender-mcp`.
