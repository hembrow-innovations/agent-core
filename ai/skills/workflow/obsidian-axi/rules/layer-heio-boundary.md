---
title: .heio is the tracker
impact: LOW
impactDescription: vault tasks are not tickets
tags: [layer, heio]
---

## .heio is the tracker

This checkout runs **heio-stack**. Issues, plans, sprints, slices, the task-pool, tickets, and archive live under `.heio/`. Git ignores that tree.

**Incorrect:** Creating a `docs/` note or vault task as the working ticket.

**Correct:** Load **heio-stack** for working items. Use this CLI on `docs/` for committed knowledge.

Notes: Daily notes are also not the tracker (`ws-daily-not-tracker`). Promote a finished outcome into `docs/` with **docs**, then close the working file in heio.
