---
title: await signals in GDScript
impact: MEDIUM
impactDescription: readable flow
tags: [async, gdscript]
---

## await signals in GDScript

Use `await` on signals and timers for sequences. Avoid deep coroutine state machines unless needed.

**Incorrect:** Boolean flags in `_Process` implementing a cutscene state machine when `await` suffices.

**Correct:**
```gdscript
await get_tree().create_timer(0.5).timeout
await animation_player.animation_finished
```

Notes: Awaiting does not block the whole engine; the function suspends.

