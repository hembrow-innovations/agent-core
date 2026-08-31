---
title: Split HTTP errors from task_error
impact: HIGH
impactDescription: 202 can still FAIL later
tags: [api, errors]
---

## Split HTTP errors from task_error

Create can succeed and the job still fail. Retry strategy depends on `task_error.type`.

**Incorrect:** Treat any non-200 as fatal, or retry `invalid_input` forever.

**Correct:**

- HTTP `400` / `401` / `402` / `404`: fix the request. Do not retry as-is.
- HTTP `429`: back off (`ops-rate-limits`).
- HTTP `5xx`: retry with jitter; check <https://status.meshy.ai>.
- Task `FAILED` + `type: invalid_input`: rewrite prompt/image (`iter-error-codes`).
- Task `timeout` / `service_unavailable` / `server_error`: retry the **same** payload a few times.

Notes: `task_error.code` (e.g. `image_too_complex`, `model_missing_uv`) plus `doc_url` is the actionable bit.
