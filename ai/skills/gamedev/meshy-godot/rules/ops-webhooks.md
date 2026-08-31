---
title: Webhooks over poll for batches
impact: LOW
impactDescription: polling burns RPS and still lags
tags: [ops, webhooks]
---

## Webhooks over poll for batches

Account webhooks POST task objects to an HTTPS URL. Better than N clients polling every 5s.

**Incorrect:** A Godot editor dock polling 20 tasks at 1 Hz during a batch.

**Correct:** CI or a tiny local server with an HTTPS webhook (smee.io for local). Return HTTP 2xx quickly, then download GLB. Godot plugin waits on Bridge, not on your poller.

Notes: Max 5 webhooks. Consecutive ≥400 responses can auto-disable. Not usable from an exported game (`sec-no-runtime-api`).
