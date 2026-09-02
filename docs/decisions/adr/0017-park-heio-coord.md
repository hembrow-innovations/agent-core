---
id: "adr-17"
title: "ADR-0017: park heio-coord"
kind: adr
description: "Heio-stack is skills and .heio files. First-party heio-coord is parked and not installed."
status: accepted
domain: pack
area: decisions
tags: [heio-stack, packages]
created_at: "2026-09-02"
updated_at: "2026-09-02"
---

# ADR-0017: park heio-coord

## Context

[[0013-heio-stack-location-map]] named skills, templates, and `@agentic-core/heio-coord` as followers of the location map. Coord was the in-session gate: `heio_stack`, `/heio`, builder write fences, claim, advance, oracle, verdict.

The tracker is already the markdown tree. Skills and agents can run the loop without the plugin. Keeping coord in profiles made dest Pi depend on an in-session boss for a file convention.

## Decision

Park `@agentic-core/heio-coord` at `deprecated/packages/heio-coord`. It is not a workspace package. It is not a first-party extension. No profile lists it. `--extension heio-coord` is unknown. Profile install removes leftover dest copies the same way it removes `heio-coms`, `heio-teams`, and `heio-todo`.

Heio-stack is `ai/skills/heio-stack/`, the `heio-*` agents, and `.heio/` notes. Agents read and write those files. They do not call `heio_stack`.

## Alternatives considered

Keep coord as optional rails. Profiles would still ship a session boss, and agents would keep two ways to touch the same tree.

Delete the package. Parking matches coms, teams, and todo.

Fold the fences into hivemind. Different process and user. Hivemind stays out of session.

## Consequences

`--extension heio-coord` dies with `Unknown extension`. First-party `--extension` names are `heio-boot`, `heio-footer`, and `heio-onic`. Builder write fences are skill-only. Status, claim, advance, and oracle are file edits and `oracle-check.mjs`.

## Relationships

- [[0013-heio-stack-location-map]]
- [[0015-hivemind-is-a-framework]]
- [[architecture-heio-coord]]
- [[architecture-pack-and-packages]]
- [[glossary]]
- [[spec-installer]]
