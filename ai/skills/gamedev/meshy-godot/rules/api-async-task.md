---
title: POST returns a task id, not a mesh
impact: HIGH
impactDescription: every Meshy generate endpoint is async
tags: [api, async]
---

## POST returns a task id, not a mesh

Create endpoints return `202` with `{ "result": "<task_id>" }`. Geometry arrives only after `status` is `SUCCEEDED`.

**Incorrect:** `var mesh = JSON.parse(post_body)["model_urls"]` on the create response.

**Correct:** Save `result`. Then poll GET, subscribe to `/…/:id/stream` (SSE), or handle a webhook. Download `model_urls.glb` only after `SUCCEEDED`.

Notes: Lifecycle is `PENDING` → `IN_PROGRESS` → `SUCCEEDED` | `FAILED` | `CANCELED`. Timestamps are Unix **milliseconds**.
