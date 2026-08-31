---
title: Set a main scene before Bridge import
impact: HIGH
impactDescription: official plugin requires a main scene
tags: [plugin, editor]
---

## Set a main scene before Bridge import

Meshy's Godot plugin imports into the open project and expects a main scene to be set. Skipping this is a common first-run stall.

**Incorrect:** Enable the plugin and Send to Godot on a project with no main scene.

**Correct:** Project → Project Settings → Application → Run → Main Scene (or `run/main_scene` in `project.godot`). Then Run Bridge.

Notes: Use a sandbox scene as main while iterating art so imports do not dump into the real title screen.
