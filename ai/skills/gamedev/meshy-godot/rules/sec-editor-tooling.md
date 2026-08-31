---
title: Meshy HTTP lives in editor or CI
impact: CRITICAL
impactDescription: keeps secrets and stalls off the main game loop
tags: [security, editor]
---

## Meshy HTTP lives in editor or CI

Generation is tooling. Put it on `EditorPlugin`, an editor dock, or a CI script — not on Autoloads that exist in the exported tree.

**Incorrect:** Autoload `MeshyClient` registered in `project.godot` `[autoload]` used by both editor and game.

**Correct:** `addons/meshy_tools/plugin.cfg` with `EditorPlugin`. Or a repo script the pipeline runs. Gameplay only `preload`s finished scenes.

Notes: If **godot-mono** is loaded, keep the plugin GDScript; C# HTTP is fine in CI, not on a gameplay node.
