---
title: Bearer msy_ on every request
impact: HIGH
impactDescription: 401 without the prefix or a live key
tags: [api, auth]
---

## Bearer msy_ on every request

Meshy requires RFC 6750 Bearer auth. Keys start with `msy_`. Base URL is `https://api.meshy.ai/openapi/`.

**Incorrect:** Query param `?api_key=`, header `X-API-Key`, or `Authorization: msy_…` without `Bearer`.

**Correct:** `Authorization: Bearer msy_…` on every create/get/delete. HTTPS only (HTTP 301).

Notes: Missing/invalid key → 401. Empty credits → 402. See `sec-key-outside-export` for storage.
