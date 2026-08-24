---
title: EnterTree vs Ready responsibilities
impact: HIGH
impactDescription: null children / order bugs
tags: [lifecycle]
---

## EnterTree vs Ready responsibilities

`_EnterTree`: node is in tree; children may not be ready. `_Ready`: children have entered and their `_Ready` completed (top-down enter, bottom-up ready).

**Incorrect:** In parent `_EnterTree`, calling methods on children that need their `@onready`/exports initialized.

**Correct:** Wire tree presence in `_EnterTree` if needed; do child-dependent setup in `_Ready` or `CallDeferred`.

Notes: Leaving the tree runs `_ExitTree`; re-entering can call `_Ready` again depending on path—design for re-entry if you reparent.

