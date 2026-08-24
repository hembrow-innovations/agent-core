---
title: Do not hide flakes with a bigger timeout
impact: HIGH
impactDescription: slow suite, flake still there
tags: [pitfall, flake]
---

## Do not hide flakes with a bigger timeout

`testTimeout: 30_000` and `--retry=3` make a wait bug expensive. They do not fix it.

**Incorrect:** `vi.setConfig({ testTimeout: 30_000 })` because `expect.poll` sometimes loses.

**Correct:** Wait on the real condition (`expect.poll`, `findBy`). Fix the race. Retry only with a named flake and an expiry.

Notes: Default test timeout is 5000ms. Raise it for a known slow integration, not for a unit.
