---
title: Quarantine only with issue and expiry
impact: CRITICAL
impactDescription: bare skip loses the bug
tags: [flake, e2e]
---

## Quarantine only with issue and expiry

A bare `test.skip` is how flakes become permanent. Use the repo's quarantine path if it has one. Otherwise skip only with an issue id and an expiry in the skip reason.

**Incorrect:**
```ts
test.skip("user can complete a task", async () => { /* flakes on CI */ });
```

**Correct:** Quarantine list or `test.skip("issue-123 expires 2026-09-01: …")`. Fix before the expiry. Do not skip units just to make a gate green.

Notes: Discover `quarantine.json` or similar before inventing a skip. Empty quarantine means nothing is parked — keep it that way unless you file the issue first.
