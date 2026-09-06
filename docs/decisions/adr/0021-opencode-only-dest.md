---
id: "adr-21"
title: "ADR-0021: dest is always OpenCode"
kind: adr
description: "Install writes .opencode/ only. Pi dest, runtime, and plugins are parked."
status: accepted
domain: pack
area: decisions
tags: [installer, opencode]
created_at: "2026-09-06"
updated_at: "2026-09-06"
---

# ADR-0021: dest is always OpenCode

## Context

[[0005-pi-only-dest]] locked dest to `.pi/` because this pack was developed in Pi. Profiles listed Pi packages, first-party Pi plugins, and `system-prompt:` copied to `.pi/APPEND_SYSTEM.md`. This repo is now only a profile installer.

## Decision

Dest is always `.opencode/`. Profiles name skills, agents, and prompts. They do not name a dest.

Install copies:

- skills to `.opencode/skills/<name>/`
- agents to `.opencode/agents/<id>.md`
- prompts to `.opencode/commands/<id>.md`

Pi runtime is deprecated. Leftover `packages:`, `settings:`, `system-prompt:`, `extensions:`, `harness:`, and `pi:` keys are errors. `--extension` is gone. First-party Pi plugins live under `deprecated/packages/`. Pi system prompts live under `deprecated/system-prompts/` and are not copied. See [[0023-pi-is-deprecated]].

This note supersedes [[0005-pi-only-dest]].

## Alternatives considered

Keep dest `.pi/` and only park plugins. That still ships a Pi dest from a repo that is not a Pi pack.

Restore `harness:` so profiles choose dest. That reopens the dest switch this pack already dropped.

## Consequences

Every profile install writes `.opencode/`. A dest OpenCode project loads skills, agents, and commands from that tree. Restart OpenCode after install. Profile install still removes leftover installer-owned `.pi/` trees.

## Relationships

- [[0005-pi-only-dest]]
- [[0006-source-libraries-beside-pi-runtime]]
- [[architecture-pack-and-packages]]
- [[schema-profile]]
- [[spec-installer]]
- [[guides-install-from-this-repo]]
- [[0023-pi-is-deprecated]]
