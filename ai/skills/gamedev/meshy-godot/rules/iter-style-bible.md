---
title: Share a style bible across the set
impact: MEDIUM
impactDescription: one-off prompts drift the art direction
tags: [iteration, style]
---

## Share a style bible across the set

Production looks like a set, not a gallery. Each Meshy call is independent unless you pin style.

**Incorrect:** Prop A "oil painted", prop B "cyberpunk neon", character "photoreal" in the same biome.

**Correct:** One style paragraph + 1–2 reference images reused on every generate/retexture (`image_style_url` or the same `text_style_prompt` tail). Store it in the sidecar (`prod-sidecar-task-ids`).

Notes: 3D Agent in the webapp is the batch concept tool (`iter-batch-agent`). API callers must copy the bible themselves.
