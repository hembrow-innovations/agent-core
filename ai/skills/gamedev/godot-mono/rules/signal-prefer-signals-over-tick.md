---
title: Prefer signals over polling
impact: HIGH
impactDescription: decoupling + CPU
tags: [signals, architecture]
---

## Prefer signals over polling

When state changes infrequently, emit signals instead of checking every frame.

**Incorrect:** UI `_Process` reads player HP every frame to update a bar.

**Correct:** Player emits `health_changed`; UI updates on signal.

Notes: Polling is fine for continuous input/aim—use judgment.

