---
title: Distinguish 429 kinds
impact: LOW
impactDescription: wrong backoff stalls batches
tags: [ops, rate-limit]
---

## Distinguish 429 kinds

Limits are per account, shared across keys. Two 429s mean different waits.

**Incorrect:** On any 429, sleep 60s and also spawn more tasks.

**Correct:**

- Message `RateLimitExceeded`: you exceeded requests/second. Pause ~1s, cap concurrency.
- Message `NoMoreConcurrentTasks`: the generation **queue** is full. Wait for a task to leave `IN_PROGRESS` before creating another.

Notes: Pro 20 rps / 10 queue. Premium 20 / 30. Ultra 20 / 100. Studio 20 / 20. Enterprise 100 rps / 50+ queue. Verify current numbers in docs — they change.
