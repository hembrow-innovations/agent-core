---
id: "guides-heio-stack"
title: "Run heio-stack"
kind: guide
description: "Plan a sprint in one sitting, then drain AFK task-pool files. Wayfinder only when the way is fog."
domain: system
area: guides
tags: [guide, heio-stack]
created_at: "2026-09-04"
updated_at: "2026-09-04"
---

# Run heio-stack

## Overview

How to plan work and leave a pool that can run without sitting in every step.

For humans in a dest that installed the heio-stack skills. Architecture: [[architecture-heio-stack]]. Decision: [[0020-heio-planning-publishes-pool]]. Terms: [[glossary]].

## Prerequisites

- Profile lists heio-stack skills (`heio-planning`, `heio-wayfinder`, `heio-slice`, `heio-stack`) and the `heio-*` agents
- `pi` in that dest, folder trusted
- After a source skill change in this pack: `pnpm exec agentic-core install . --profile agentic-core`

Live notes are gitignored under `.heio/`. Durable outcomes go in `docs/`.

## Steps

1. **Fog or a sitting.** If the destination is not visible and the work will not fit one sitting, invoke **heio-wayfinder**. It charts intent, locations, and fog. It does not write slices or the task-pool. If there is no fog, skip this step.

2. **Plan once.** Invoke **heio-planning** with the sprint, slice, or ticket. Answer frontier rounds. Confirm the tracer-bullet list: title, slice, blocked-by, AFK or HITL, what it delivers. Prefer AFK.

3. **Check the write.** After confirm, the sitting should have published:
   - sticky map files it settled (`intent.md`, `roadmap.md`, optional `locations/<slug>.md`, sprint `shape.md` status `active`)
   - every settled slice at `.heio/planning/sprints/<id>/slices/s-<slug>.md`, status `frozen`, oracles on the file, Pool `[[id]]` links
   - every task at `.heio/planning/task-pool/<id>.md`, status `ready`, `mode: afk` or `mode: hitl`, `blocked-by`

   A slice still in fog is not on disk. HITL tasks are `ready` with `mode: hitl`; drain skips them.

4. **Walk away from AFK.** Unblocked `mode: afk` tasks are the grab-queue. Invoke **heio-slice** on a frozen slice to drain them, or let another session claim one. One writer per cwd.

5. **Stay for HITL.** When drain reports only HITL remains, answer those tasks. Do not fake AFK defaults.

6. **Inbound work.** A product signal is a ticket first. Triage: fits an unblocked active slice → task on that slice; fits the project, not this slice → park; would rewrite a location → escalate to wayfinder.

7. **Close.** Slice is `met` when oracles hold and every linked task-pool id is `completed`. Completed task files move to `.heio/archive/planning/task-pool/`. Links stay on the slice.

Every output ends `VERDICT: TASK | TICKET | ESCALATE | VERIFY`.

## Examples

- **Sprint in one sitting.** `/heio-planning week-1` → grill destination if missing, slices, oracles, AFK vs HITL → confirm → all in-slices frozen and the pool ready → `/heio-slice s-login` drains AFK.
- **Too big to see.** `/heio-wayfinder auth` charts locations and fog → later `/heio-planning` publishes only the slices that are now sharp.
- **Ticket during drain.** Inbound bug → **heio-triage**. Fits the active slice → new `ready` task linked from the slice. Does not fit → parked ticket.

## Reference

- Skills: `ai/skills/heio-stack/`
- Prompts: `/heio-planning`, `/heio-wayfinder`, `/heio-slice`
- Templates: `ai/skills/heio-stack/heio-stack/templates/`
- Loop: [[architecture-heio-stack]]
- Map grain: [[0013-heio-stack-location-map]]
