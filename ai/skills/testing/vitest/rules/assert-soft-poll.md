---
title: Use expect.soft and expect.poll on purpose
impact: MEDIUM
impactDescription: soft hides a real fail, poll replaces a sleep
tags: [assert]
---

## Use expect.soft and expect.poll on purpose

`expect.soft` keeps running so you see every broken field. `expect.poll` retries. Neither is a default.

**Incorrect:** Wrapping every assertion in `expect.soft` so the file stays green-ish.

**Correct:** `expect.soft(user.email).toBe("a@b.c")` next to `expect.soft(user.id).toBe(1)` in one behavior. `await expect.poll(() => status()).toBe("ready")` for async state.

Notes: A hard `expect` after softs still stops the test. Poll timeout is `expect.poll.timeout` (default 1000).
