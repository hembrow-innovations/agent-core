---
title: Persist assets before Meshy deletes them
impact: CRITICAL
impactDescription: 3-day retention on non-Enterprise
tags: [pipeline, retention]
---

## Persist assets before Meshy deletes them

API assets last **3 days** unless you are Enterprise. `model_urls` are signed and time-limited even sooner.

**Incorrect:** Keep only the task id in a spreadsheet and re-fetch weeks later.

**Correct:** On `SUCCEEDED`, download GLB + thumbnail into git (or LFS) immediately. Record the task id in a sidecar for regeneration, not as the source of truth.

Notes: Re-run the task if you missed the window — you cannot recover the old bytes.
