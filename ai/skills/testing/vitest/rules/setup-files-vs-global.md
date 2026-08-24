---
title: Know setupFiles from globalSetup
impact: HIGH
impactDescription: shared server started N times, or mocks missing
tags: [setup]
---

## Know setupFiles from globalSetup

`setupFiles` run in every test file / worker. `globalSetup` runs once in a separate process and cannot see `vi`.

**Incorrect:** Putting `vi.mock` in `globalSetup`, or starting one Docker DB in `setupFiles`.

**Correct:** `setupFiles` for `vi.mock`, jest-dom, and `afterEach` cleanup. `globalSetup` / `globalTeardown` for a single shared process.

Notes: A function returned from `globalSetup` is the teardown. `sequence.setupFiles: "list"` if order matters.
