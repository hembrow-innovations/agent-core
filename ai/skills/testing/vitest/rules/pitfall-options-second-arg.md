---
title: Put test options in the second argument
impact: HIGH
impactDescription: retry and timeout silently ignored
tags: [pitfall, v4]
---

## Put test options in the second argument

Vitest 4 removed the third-argument options object. A trailing number is still a timeout. An object in the third slot is not.

**Incorrect:** `test("example", () => { ... }, { retry: 2 })`

**Correct:** `test("example", { retry: 2 }, () => { ... })` or `test("example", () => { ... }, 1000)` for a timeout only.

Notes: Same shape for `describe` and `it`.
