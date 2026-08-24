---
title: Mocked mutations are not persistence
impact: HIGH
impactDescription: RNTL green does not prove the row saved
tags: [rn, mock, e2e]
---

## Mocked mutations are not persistence

Native page tests spy `mutate`. A green press test means the handler fired, not that the backend wrote a row.

**Incorrect:** Claiming "complete task works on mobile" because `mockComplete` was called.

**Correct:** Unit: `expect(mockComplete).toHaveBeenCalledWith(expect.objectContaining({ id: TASK_ID }))`. Device proof: Maestro (or the repo's mobile E2E) against a real build and seeded user. Hook/API proof: the shared data-package suite.

Notes: Do not widen the unit test to hit the network.
