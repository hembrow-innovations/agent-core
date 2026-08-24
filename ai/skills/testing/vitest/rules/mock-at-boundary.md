---
title: Mock at the service boundary
impact: HIGH
impactDescription: tests coupled to internals
tags: [mock]
---

## Mock at the service boundary

Spying on private helpers locks the file shape. Mock the network, the repo, or the hook the UI already calls.

**Incorrect:** `vi.spyOn(mod, "parseInternalRow")` to drive a page test.

**Correct:** Mock `fetch` / the client / the data hook. Leave internals free to move. UI details live in `react-testing`.

Notes: If you cannot mock without reaching inside, the seam is wrong. See `tdd`.
