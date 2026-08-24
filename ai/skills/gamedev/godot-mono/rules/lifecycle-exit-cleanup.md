---
title: Cleanup on ExitTree
impact: MEDIUM
impactDescription: leaks and stale callbacks
tags: [lifecycle]
---

## Cleanup on ExitTree

Disconnect external signals, stop timers, and clear static/event subscriptions when leaving the tree.

**Incorrect:** C# `SomeAutoload.Event += Handler` in `_Ready` without `-=` on exit.

**Correct:** Pair subscribe/unsubscribe in `_EnterTree`/`_ExitTree` or `_Ready`/`_ExitTree`.

Notes: Lambdas that close over `this` are harder to disconnect—prefer method group handlers.

