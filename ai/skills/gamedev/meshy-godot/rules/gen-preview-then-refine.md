---
title: Text-to-3D is preview then refine
impact: HIGH
impactDescription: refine without a succeeded preview wastes credits
tags: [generation, text-to-3d]
---

## Text-to-3D is preview then refine

`POST /openapi/v2/text-to-3d` is two tasks. Preview builds untextured geometry. Refine textures a **succeeded** preview.

**Incorrect:** One POST with `mode: "refine"` and no `preview_task_id`, or refining a preview still `IN_PROGRESS`.

**Correct:** `mode: "preview"` + `prompt`. Wait `SUCCEEDED`. Judge the shape. Then `mode: "refine"` + `preview_task_id` + `enable_pbr: true`.

Notes: Prompt max 600 chars. Prefer `ai_model: "latest"` (Meshy 7). `ultra_mode` is preview-only on meshy-7 and costs extra.
