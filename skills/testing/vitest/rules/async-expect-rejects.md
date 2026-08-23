---
title: Assert rejections with expect().rejects
impact: HIGH
impactDescription: thrown promise becomes unhandled
tags: [async]
---

## Assert rejections with expect().rejects

`await fn()` that should throw fails the test with a stack, not a matcher. `rejects` is the assertion.

**Incorrect:** `await fetchUser(0);` in a test named "rejects for missing user".

**Correct:** `await expect(fetchUser(0)).rejects.toThrow("User 0 not found");`

Notes: `resolves` is the success twin. Always `await` both.
