---
id: "adr-12"
title: "ADR-0012: session todos are pinned @inobit/pi-todo"
kind: adr
description: "This pack does not ship a todo extension. Session checklists are npm:@inobit/pi-todo@0.1.1. First-party heio-todo is parked."
status: accepted
domain: packages
area: decisions
tags: [packages, installer, todo]
created_at: "2026-08-31"
updated_at: "2026-08-31"
---

# ADR-0012: session todos are pinned @inobit/pi-todo

## Context

`@agentic-core/heio-todo` wrote session checklists under `.heio/sessions/<sessionId>/TODO.md`. That cluttered the tracker. Other coding agents keep session todos outside the project, usually as session-branch state. `@inobit/pi-todo@0.1.1` already does that for Pi: no disk, no net, no install scripts, MIT, state in tool-result `details`.

[[0008-todo-owns-checklist-store]] put the store in the first-party todo package so dest copies stayed self-contained. That package is no longer a product we maintain.

## Decision

Profiles list `npm:@inobit/pi-todo@0.1.1`. Do not float the version. Do not install the rest of `@inobit/pi-packages`. `packages/heio-todo` is parked at `deprecated/packages/heio-todo`. It is not a first-party extension. Profile install removes leftover dest copies the same way it removes `heio-coms` and `heio-teams`.

There is still no `packages/lib`.

## Alternatives considered

Keep maintaining `heio-todo` and move its files to `~/.pi/agent/`. That is a store we would still own.

Use Pi's sample `todo.ts` or `@diegopetrucci/pi-todo`. Those are the same session-entry idea with less packaging.

Leave both tools installed. `todo` and `heio_todo` fight.

## Consequences

Agents call `todo` and `/todos`. They do not write `.heio/TODO.md` or `.heio/sessions/*/TODO.md`. Path protection of those files goes away with the parked package. Re-review the npm tarball on any version bump.

## Relationships

- [[0008-todo-owns-checklist-store]]
- [[architecture-heio-todo]]
- [[architecture-pack-and-packages]]
- [[glossary]]
- [[spec-installer]]
