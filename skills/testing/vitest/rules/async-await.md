---
title: Write async tests, not done callbacks
impact: HIGH
impactDescription: done is not supported
tags: [async]
---

## Write async tests, not done callbacks

Vitest has no Jest `done`. A callback test never finishes, or finishes before the work does.

**Incorrect:** `it("works", (done) => { load().then(() => done()); })`

**Correct:** `it("works", async () => { await load(); })` or `it("works", () => new Promise((resolve) => { ...; resolve(); }))`.

Notes: Returning a teardown from `beforeEach` is not a `done`. See `setup-hooks-return`.
