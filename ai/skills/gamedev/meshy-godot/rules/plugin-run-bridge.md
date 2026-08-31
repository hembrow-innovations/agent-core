---
title: Run Bridge, then Send to Godot
impact: HIGH
impactDescription: Pro+ DCC Bridge is the editor import path
tags: [plugin, bridge]
---

## Run Bridge, then Send to Godot

Bridge is a live editor connection, not a file watcher. The webapp talks to the running plugin.

**Incorrect:** Click Send to Godot in the workspace with Godot closed or Bridge not started.

**Correct:** Open the Meshy dock in Godot → **Run Bridge**. In the Meshy workspace (Pro+), DCC Bridge → **Send to Godot**. The GLB downloads and imports into the current scene.

Notes: Community models can also be sent. Animated models import with animation data. Plugin import is still a draft — bake a PackedScene for production (`path-bake-glb`).
