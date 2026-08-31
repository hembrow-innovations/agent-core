---
title: HTTPRequest off the game loop
impact: HIGH
impactDescription: polling in _process stalls the editor and the game
tags: [api, godot, async]
---

## HTTPRequest off the game loop

Godot HTTP is async. Tight poll loops on `_process` burn frames and trip rate limits.

**Incorrect:** `_process` calling `_http.request(poll_url)` every frame.

**Correct:** `HTTPRequest.request()` once. `await request_completed`. On non-terminal status, `await get_tree().create_timer(5.0).timeout` then GET again. Prefer SSE/webhooks for batches (`ops-webhooks`).

Notes: Node HTTP APIs are main-thread. Do not deadlock the editor with a busy-wait. C# `HttpClient` belongs in CI or an editor tool, not `_Process`.
