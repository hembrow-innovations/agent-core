---
id: "adr-5"
title: "ADR-0005: dest is always Pi"
kind: adr
description: "Install writes .pi/ only. Profiles no longer name a dest."
status: accepted
domain: pack
area: decisions
tags: [installer, pi]
created_at: "2026-08-25"
updated_at: "2026-08-25"
---

# ADR-0005: dest is always Pi

## Context

Profiles used to name a dest with `harness:`. The installer could write `.opencode/`, `.claude/`, `.pi/`, or `.agents/`. `--harness` overrode that. OpenCode-only keys (`agents`, `prompts`, `templates`) rode on the same switch.

This pack is developed and used in Pi. The dest switch kept a second install path alive and forced every profile to say which dest it was for.

## Decision

Dest is always `.pi/`. Profiles name skills, playbooks, and extensions. They do not name a dest.

`--harness` is gone. Leftover `harness:`, `pi:`, `agents:`, `prompts:`, `templates:`, and `commands:` keys are errors.

The OpenCode pack under `ai/agents/` and `ai/prompts/` is gone. Pi identity stays under `ai/pi/agents/`.

## Alternatives considered

Keep the dest switch and drop the unused dests later. That leaves a key every profile must set for no choice.

Keep OpenCode source and stop installing it. Dead pack files would still look like a second dest.

## Consequences

Every profile install writes `.pi/skills` and the Pi runtime. Former OpenCode profiles become skill lists for Pi. Vendor write happens whenever a profile or `--extension` names a first-party package.

[[0002-standalone-vendor-install]] still owns the vendor copy. [[0004-source-pack-under-ai]] still owns the `ai/` layout. This note owns dest identity.

## Relationships

- [[glossary]]
- [[architecture-pack-and-packages]]
- [[spec-installer]]
- [[guides-install-from-this-repo]]
- [[0002-standalone-vendor-install]]
- [[0004-source-pack-under-ai]]
