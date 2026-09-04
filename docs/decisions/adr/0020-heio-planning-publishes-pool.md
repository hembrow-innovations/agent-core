---
id: "adr-20"
title: "ADR-0020: one planning sitting publishes the task-pool"
kind: adr
description: "Grill until shared understanding, then freeze slices and write ready task-pool files in the same sitting. Wayfinder is fog. Slice drains AFK work."
status: accepted
domain: system
area: decisions
tags: [heio-stack]
created_at: "2026-09-04"
updated_at: "2026-09-04"
---

# ADR-0020: one planning sitting publishes the task-pool

## Context

Heio-stack split planning across three user-invoked sittings. Wayfinder wrote intent, roadmap, and sprint shape, then stopped. Planning froze one slice, then stopped. Slice spawned tasker and only then wrote the pool. Understanding was paid for three times. The pool did not exist until a human started execution, so nothing could run unattended.

[[0013-heio-stack-location-map]] still holds: locations are the map, unblocked slices may run in parallel, a workflow loop must not rewrite destination sentences or patch frozen `EXPECT:`, and tasks must not be written before freeze.

Matt Pocock's grill → to-tickets → ready-for-agent queue is the pattern: one interview, then publish independently grabbable units. HITL vs AFK decides what can drain without a human.

## Decision

**heio-planning** is one sitting. Grill until the frontier is empty. Confirm the understanding and the tracer-bullet breakdown. Then publish, in that same sitting:

- sticky map files this sitting settled
- every settled slice, status `frozen`, oracles on the file
- every task-pool file, status `ready`, with `mode: afk` or `mode: hitl` and `blocked-by`

A slice still in fog stays off disk. Drain skips HITL.

**heio-wayfinder** charts fog: destination, locations, the way that will not fit one sitting. If there is no fog, stop; the work fits planning.

**heio-slice** drains a frozen slice. It claims unblocked AFK tasks. It does not publish the pool. Missing pool or missing `EXPECT:` means the slice still needs a planning sitting.

Tasks stay fluid. The plan is still slices plus oracles. The pool is derived once, after freeze.

## Alternatives considered

Keep three sittings and spawn tasker from slice. That is the stop/start this decision removes.

Make wayfinder publish slices and tasks. Wayfinder is for fog. Publishing execution units while the way is unclear writes the list as the plan.

Drop HITL vs AFK and treat every `ready` task as agent-grabbable. HITL defaults get faked and the human is pulled back in.

## Consequences

A planning sitting can leave a grab-queue. Other sessions drain unblocked AFK tasks without another interview. Wayfinder is no longer the default planning door. `heio-tasker` remains a fallback for a frozen slice that still has no pool; slice does not spawn it.

## Relationships

- [[0013-heio-stack-location-map]]
- [[architecture-heio-stack]]
- [[guides-heio-stack]]
- [[glossary]]
