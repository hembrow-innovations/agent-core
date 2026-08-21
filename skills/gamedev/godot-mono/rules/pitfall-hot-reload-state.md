---
title: C# hot reload drops non-exported state
impact: HIGH
impactDescription: heisenbugs while iterating
tags: [pitfall, csharp]
---

## C# hot reload drops non-exported state

On script reload, non-exported fields may reset. Exported vars are the durable editor-facing state.

**Incorrect:** Assuming private runtime caches survive hot reload during playtest.

**Correct:** Re-init caches in `_Ready`; keep design-time config in `[Export]`; don’t rely on reload for multiplayer/long sessions.

Notes: When confused, stop play and rebuild cleanly.

