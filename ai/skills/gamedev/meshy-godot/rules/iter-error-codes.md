---
title: Map task_error to retry or rewrite
impact: MEDIUM
impactDescription: blind retries burn the queue
tags: [iteration, errors]
---

## Map task_error to retry or rewrite

`FAILED` is not one failure. The `code` decides the next human action.

**Incorrect:** Re-POST the same payload on `image_too_complex`.

**Correct:**

- `image_too_complex`: crop to one object, simplify, or split the scene into props.
- `model_missing_uv`: unwrap or set `enable_original_uv: false`.
- `timeout` / `server_error` / `service_unavailable`: retry with backoff.
- Pose 422 on rig: A/T pose, humanoid only (`anim-humanoid-limits`).

Notes: Follow `doc_url` on the error object when present. Log task id in the sidecar even on failure.
