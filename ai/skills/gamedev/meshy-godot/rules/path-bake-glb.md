---
title: Bake GLB into res:// before shipping
impact: CRITICAL
impactDescription: shipped games must not depend on Meshy uptime
tags: [pipeline, production]
---

## Bake GLB into res:// before shipping

Meshy URLs die. Non-Enterprise files are deleted after **3 days**. A production build loads local resources only.

**Incorrect:** Store a Meshy `model_urls.glb` HTTPS link in a Resource and fetch it at runtime.

**Correct:** Download GLB into `res://assets/<set>/<name>/model.glb`, let Godot import it, instance the resulting PackedScene in gameplay.

Notes: Treat runtime Meshy as a prototype. The ship artifact is the imported scene, not the task id.
