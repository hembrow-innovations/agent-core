---
title: Operate via API, not UI tutorials
impact: HIGH
impactDescription: agent-efficient Blender
tags: [mcp, style]
---

## Operate via API, not UI tutorials

Do not write "click Object → Apply → Scale" essays. Execute equivalent `bpy` ops via MCP.

**Incorrect:** Long keyboard shortcut lists for the human to perform manually when MCP is connected.

**Correct:** Call the operator/data API; mention human steps only when MCP cannot (addon install, GPU driver, file picker auth).
