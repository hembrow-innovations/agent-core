---
id: "adr-13"
title: "ADR-0013: heio-stack is a location map"
kind: adr
description: "Roadmap grain is locations, not bets. Sprints group work. Parallel unless blocked. Archive mirrors the live tree. Workflow guards stay; a general agent may edit the map."
status: accepted
domain: system
area: decisions
tags: [heio-stack]
created_at: "2026-09-01"
updated_at: "2026-09-04"
---

# ADR-0013: heio-stack is a location map

## Context

Heio-stack was a single-spine loop: an ordered roadmap of **bets**, one sprint, one active slice, and a fence that blocked every session from writing intent, roadmap, and sprint shape. Builders could not wander. Planners and a human asking to grow the map could not either. The files also carried almost no links into `docs/` or code, so the next agent had to hunt for the why.

The loop (TASK / TICKET / ESCALATE / VERIFY) is still useful. The spine is not.

## Decision

The map is **locations**. A location is a destination bullet: this is working when. Bets are optional sub-bullets under a location (`bet: try X; pivot if Y`). If a bet wins, it becomes a location or a sprint grouping. It is not the grain of the roadmap.

A location stays a bullet until it needs depth. Then `planning/locations/<slug>.md` — same shape, nested location bullets, no nested folders.

A **sprint** is a grouping of slices and tasks. Name it after a location or a timebox (`week-1`). Slices live under the sprint, not under `locations/`.

Unblocked slices and tasks may run in parallel. Many slices may be `active`. A slice names `blocked-by` when it must wait. One workflow still does not run two writers on one cwd.

Finished work **moves** to `.heio/archive/`, which mirrors `planning/` and `tickets/`. `archive/index.md` is one-liners of what landed. Done location bullets leave the live roadmap.

**Gating is session-shaped.** A workflow loop (heio-slice / builder / tasker / verifier) must not rewrite intent success/non-goals or location destination sentences, must not write tasks before freeze, and must not patch frozen `EXPECT:`. A general agent the human is talking to may edit the map. Tickets are inbound product signals, not map hygiene.

Notes carry enough ADRs, specs, paths, and whys that a stranger does not hunt. That is not a freeze ritual.

Skills and templates follow this. `@agentic-core/heio-coord` is parked ([[0017-park-heio-coord]]). Terms: [[glossary]].

## Alternatives considered

Keep ordered bets and one active slice. That is the design that fought the user.

Nested location folders. Differing depth does not need a tree.

Unlock builders as well as general agents. Destination rewrites during a build are how the bet changes without saying so.

A `## Done` section on the live roadmap. That becomes the clutter archive is meant to remove.

Ticket-first for every map edit. That is the ritual that blocked intended edits.

## Consequences

Wayfinder charts locations, not ordered bets. A builder-shaped session must not rewrite sticky planning paths, and the stack does not enforce a single active slice. A planning sitting publishes the task-pool after freeze ([[0020-heio-planning-publishes-pool]]). Status, claim, advance, and oracle must name a slice when more than one is in flight. Two builders on one dirty tree stay out. The live gate that used to do this in-session is parked ([[0017-park-heio-coord]]).

## Relationships

- [[glossary]]
- [[architecture-heio-stack]]
- [[0017-park-heio-coord]]
- [[0020-heio-planning-publishes-pool]]
