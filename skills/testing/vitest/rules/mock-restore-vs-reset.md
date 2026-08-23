---
title: Know restore, reset, and clear in Vitest 4
impact: HIGH
impactDescription: automocks stay stubbed, or spies leak
tags: [mock, v4]
---

## Know restore, reset, and clear in Vitest 4

`vi.restoreAllMocks` only restores `vi.spyOn`. It no longer resets automocks. `mockReset` on `vi.fn(impl)` returns to `impl`, not to `undefined`.

**Incorrect:** Calling `vi.restoreAllMocks()` and assuming `vi.mock` factories went back to original exports.

**Correct:** `mockClear` for call history. `mockReset` to drop a per-test implementation. `mockRestore` / `vi.restoreAllMocks` for spies. Re-apply automock state in `beforeEach` if you need a clean factory.

Notes: Config `restoreMocks` follows the same v4 rule. Jest's `mockReset` emptied the impl. Vitest does not.
