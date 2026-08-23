---
title: You cannot mock a call inside the same file
impact: HIGH
impactDescription: spy looks live, production path is unchanged
tags: [pitfall, mock]
---

## You cannot mock a call inside the same file

`foo` inside `foobar` is a local binding. `vi.spyOn(mod, "foo")` only wraps the export other files see.

**Incorrect:** Spying on `foo` to change what `foobar()` does when both live in `foobar.js`.

**Correct:** Split the helper into another module, or inject it. Do not ask the runner to rewrite same-file calls.

Notes: This is intended. Architecture owns testability, not Vitest.
