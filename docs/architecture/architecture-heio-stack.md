---
id: "architecture-heio-stack"
title: "Heio-stack"
kind: architecture
description: "Location map, one planning sitting that publishes a ready task-pool, and AFK drain. Skills and .heio files, not a session plugin."
domain: system
area: architecture
tags: [architecture, heio-stack]
created_at: "2026-09-04"
updated_at: "2026-09-04"
---

# Heio-stack

## Overview

Heio-stack is the working tracker for this checkout. Live notes sit under `.heio/planning/`, `.heio/tickets/`, and `.heio/archive/`. Git ignores `.heio/`. `docs/` is the committed source of truth.

The OS is skills under `ai/skills/heio-stack/` plus `heio-*` agents. There is no in-session gate. Parked coord: [[architecture-heio-coord]], [[0017-park-heio-coord]].

Terms: [[glossary]]. Map grain: [[0013-heio-stack-location-map]]. Planning write: [[0020-heio-planning-publishes-pool]]. How to run a sitting: [[guides-heio-stack]].

## Context

The stack used to split planning across three user-invoked sittings. Wayfinder wrote the map and stopped. Planning froze one slice and stopped. Slice spawned tasker and only then wrote the pool. Understanding was paid for three times. Nothing could run unattended until a human started execution.

The map is still locations. Unblocked slices may still run in parallel. What changed is the write: one planning sitting publishes frozen slices and a ready task-pool. Drain claims AFK work. Wayfinder is fog.

## Design

### Three layers

- **Intent (sticky)**: why the project exists, success, non-goals. `.heio/planning/intent.md`
- **Map (semi-sticky)**: locations, optional location files, sprint groupings. `.heio/planning/roadmap.md`, `locations/`, `sprints/<id>/shape.md`
- **Work (fluid)**: task-pool files and inbound tickets. Derived after freeze. Not the plan.

The plan is slices plus oracles. Tasks churn.

### Sittings

- **Planning sitting** (`heio-planning`). Grill until the frontier is empty. Confirm the tracer-bullet breakdown. Publish, in that same sitting, every settled slice (`frozen`, oracles on the file) and every task-pool file (`ready`, `mode: afk` or `mode: hitl`, `blocked-by`). A slice still in fog stays off disk.
- **Wayfinder** (`heio-wayfinder`). Fog: destination, locations, the way that will not fit one sitting. If there is no fog, stop. The work fits planning.
- **Drain** (`heio-slice`). Claim unblocked `mode: afk` tasks on a frozen slice. Missing pool or missing `EXPECT:` means the slice still needs a planning sitting. HITL waits. Slice does not publish the pool.

`heio-tasker` remains a fallback for a frozen slice that still has no pool. Drain does not spawn it.

### Grab-queue

A task is agent-grabbable when it is `ready`, `mode: afk`, and every `blocked-by` id is `completed` or none. Other sessions may take other unblocked AFK tasks. One writer per cwd. Two builders do not share a dirty tree.

Statuses: `draft` → `ready` → `claimed` → `implemented` → `completed`. Completed files move to `.heio/archive/planning/task-pool/`. Slice `[[id]]` links are never dropped.

### Loop

Every output ends:

```text
VERDICT: TASK | TICKET | ESCALATE | VERIFY
EVIDENCE: <one line>
```

- **TASK**: fits an unblocked active slice. Do it, or add a task-pool file and link it.
- **TICKET**: belongs to the project, not this slice. File under `.heio/tickets/`.
- **ESCALATE**: would rewrite a location destination. Stop. Chart the map.
- **VERIFY**: check oracles on the slice file until they hold, or `ABANDON:` with a named home.

A workflow loop must not rewrite intent success/non-goals or location destination sentences, must not write tasks before freeze, and must not patch frozen `EXPECT:`. A planning sitting writes tasks after freeze. A general agent the human is talking to may edit the map.

## Trade-offs

The design optimises for one interview, then a pool that can drain without another sitting.

It sacrifices a second confirm per slice. Granularity is one quiz in the planning sitting. Fog that was published as AFK will be built wrong; leave fog off disk.

Builder fences are prompt-only. [[architecture-heio-coord]].

## Consequences

`AGENTS.md` names planning as the default door, wayfinder as fog, slice as drain. Skills and templates follow [[0020-heio-planning-publishes-pool]]. Hivemind's unattended planner is a different dest lane; it freezes one slice and leaves the pool to that dest's rules.
