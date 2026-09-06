---
id: "adr-23"
title: "ADR-0023: Pi is deprecated in this repo"
kind: adr
description: "This checkout is markdown libraries, stacks, and profiles for OpenCode dest. Pi runtime, plugins, and system prompts are deprecated under deprecated/."
status: accepted
domain: pack
area: decisions
tags: [installer, pi, deprecated]
created_at: "2026-09-06"
updated_at: "2026-09-06"
---

# ADR-0023: Pi is deprecated in this repo

## Context

[[0021-opencode-only-dest]] already locked dest to `.opencode/` and parked first-party Pi plugins. Pi runtime markdown still sat in `ai/system-prompts/`. Leftover profile keys still talked about Pi as parked rather than done.

This repo is the AI installer: markdown libraries, stacks, and profiles. It is not a Pi pack.

## Decision

Pi is deprecated here.

- First-party Pi plugins stay under `deprecated/packages/`
- Pi runtime markdown moves to `deprecated/system-prompts/`
- There is no `ai/pi/` and no `ai/system-prompts/`
- Leftover profile keys `packages:`, `settings:`, `system-prompt:`, `extensions:`, `harness:`, and `pi:` stay errors
- `--extension` stays an unknown flag
- Install does not write `.pi/`

Parked tests for the old Pi dest stay under `deprecated/tests/pi/`.

## Alternatives considered

Leave `ai/system-prompts/` in the pack tree and only skip copying it. That keeps Pi source in the live library.

Delete the parked Pi tree now. Deprecation keeps the files until a keep-or-delete call.

## Consequences

Edit pack files under `ai/`, stacks under `stacks/`, and profiles under `profiles/`. Do not add Pi runtime, plugins, or dest writes. This note sits on top of [[0021-opencode-only-dest]].

## Relationships

- [[0021-opencode-only-dest]]
- [[0022-stacks-are-units]]
- [[0005-pi-only-dest]]
- [[0006-source-libraries-beside-pi-runtime]]
- [[architecture-pack-and-packages]]
