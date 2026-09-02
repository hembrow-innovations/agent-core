---
id: "architecture-heio-coord"
title: "Heio coord"
kind: architecture
description: "First-party heio-coord is parked. Heio-stack is skills and .heio files, not a session plugin."
domain: pack
area: architecture
tags: [architecture, heio-stack]
created_at: "2026-09-02"
updated_at: "2026-09-02"
---

# Heio coord

## Overview

Parked under `deprecated/packages/heio-coord`. Not in the workspace. Not installed by any profile.

`@agentic-core/heio-coord` used to register `heio_stack` and `/heio`, fence builder writes, and claim, advance, oracle, and verdict on `.heio/` notes. That gate is not a product we maintain.

Heio-stack is the skill pack and the working tree. See [[0017-park-heio-coord]].

## Context

[[0013-heio-stack-location-map]] let dest Pi enforce freeze and claims as a thin extension. The loop (TASK / TICKET / ESCALATE / VERIFY) already lived in skills. The plugin duplicated that loop inside the session.

## Design

Profiles do not list `local:@agentic-core/heio-coord`. Install does not copy a first-party coord tree. Profile install removes leftover `.pi/npm/local/@agentic-core/heio-coord` and `.pi/npm/node_modules/@agentic-core/heio-coord` the same way it removes parked `heio-coms`, `heio-teams`, and `heio-todo`.

Agents must not call `heio_stack` or `/heio`. They read `.heio/planning`, `.heio/tickets`, and `.heio/archive`, and they run slice oracles through the oracle skill.

## Trade-offs

We do not maintain an in-session stack gate. Builder fences are prompt-only. A dest that still has a leftover coord copy loses it on the next profile install.

## Consequences

`--extension heio-coord` is an unknown extension. First-party `--extension` names are `heio-boot`, `heio-footer`, and `heio-onic`.

Terms live in [[glossary]].
