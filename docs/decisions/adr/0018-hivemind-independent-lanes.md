---
id: "adr-18"
title: "ADR-0018: Hivemind lanes are independent and config lives under .hivemind/"
kind: adr
description: "Dest runtime is .hivemind/hivemind.yaml. Lanes are a named map with per-lane concurrency. Actors and typed lanes (single, pipeline)."
status: accepted
domain: hivemind
area: decisions
tags: [hivemind]
created_at: "2026-09-03"
updated_at: "2026-09-03"
---

# ADR-0018: Hivemind lanes are independent and config lives under .hivemind/

## Context

[[0015-hivemind-is-a-framework]] put runtime config at project-root `hivemind.yaml`. Lanes were a list. A single top-level `concurrency` capped live children across every lane. File order was priority: the first matching lane could take the last seat and starve later lanes.

That was unexpected. A lane is a trigger that should fire when a matching file is ready. Lanes are not a pipeline unless the user writes a pipeline. Reusable spawn identity (cmd, agent, prompt, scope, claim-status) was copied on every lane.

Actors and extra yaml need a directory, not one root file.

## Decision

- Runtime config is `.hivemind/hivemind.yaml`. Missing file is fatal. Root `hivemind.yaml` is not read. Install write-if-missing copies the profile template there. If only a legacy root file exists, install copies it to `.hivemind/hivemind.yaml` once.
- `lanes` is a map keyed by lane id. There is no `lane:` field.
- There is no top-level `concurrency`. Each lane has its own `concurrency` (default `1`). Lanes do not share a seat pool. File order is not priority.
- `type` is required. v1 types are `single` (one child life) and `pipeline` (ordered stages, one claim, sequential children, stop on non-zero). Unknown types fail closed.
- `actors` may be defined in `.hivemind/hivemind.yaml` and in `.hivemind/actors/*.yaml`. A file is either one actor (top-level `cmd`, name is the stem) or a map of named actors. Duplicate names across files fail. The main yaml overlays files of the same name.
- An actor is the reusable spawn identity: `cmd`, `agent`, `prompt`, `scope` / `exclusive`, `claim-status`, plus extra string scalars. Lane and stage fields override the actor after merge. Trigger, need, backoff, cooldown, concurrency, type, and stages stay on the lane.
- Profile templates stay at `profiles/<name>/hivemind.yaml`. Dest runtime is `.hivemind/hivemind.yaml`.

## Alternatives considered

Keep global concurrency and document that list order is priority. Starves later lanes under a small cap. Rejected.

Name the one-shot type `unit` or `action`. `single` is the type in the requested schema.

Read both root `hivemind.yaml` and `.hivemind/hivemind.yaml`. Two contracts. Rejected. Legacy copy-once is the migration.

## Consequences

Existing dest root files are inert until install migrates them or the user moves them. Reinstall does not overwrite `.hivemind/hivemind.yaml`.

Heio-stack templates stay independent `single` lanes. A `pipeline` is opt-in for one match that runs several agents in order.

Schema: [[schema-hivemind]]. Behaviour: [[spec-hivemind]].

## Relationships

- [[0015-hivemind-is-a-framework]]
- [[0016-profiles-are-directories]]
- [[schema-hivemind]]
- [[spec-hivemind]]
- [[purpose-hivemind]]
- [[spec-installer]]
- [[schema-profile]]
