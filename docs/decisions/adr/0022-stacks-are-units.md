---
id: "adr-22"
title: "ADR-0022: stacks are product units"
kind: adr
description: "A stack lives under stacks/<name>/ and ships everything inside it. A profile names the stack to install it. Shared libraries stay in ai/."
status: accepted
domain: pack
area: decisions
tags: [installer, stacks, layout]
created_at: "2026-09-06"
updated_at: "2026-09-06"
---

# ADR-0022: stacks are product units

## Context

Heio-stack lived under `ai/skills/heio-stack/`, with `heio-*` agents in `ai/agents/` and prompts in `ai/prompts/heio-stack/`. Every profile that wanted the tracker had to list those files one by one. Later stacks would have repeated that split.

The pack under `ai/` is the shared library. A product unit should sit beside it, not inside it.

## Decision

`stacks/<name>/` is a product unit. It comes with everything inside that folder:

- `stacks/<name>/agents/<id>/<id>.md`
- `stacks/<name>/skills/<skill>/SKILL.md`
- `stacks/<name>/prompts/` markdown

A profile names the stack:

```yaml
stacks:
  - heio-stack
```

Install copies that unit. The profile may still list pack skills, agents, and prompts from `ai/`. `agents: all` and `prompts: all` stay pack-only. Named stacks add their own files.

`stacks/heio-stack` is the first stack. Shared libraries stay in `ai/`. New stacks are new folders under `stacks/`.

## Alternatives considered

Keep heio-stack in `ai/` and only add a profile shorthand. That still mixes a product unit into the shared library.

Put stacks under `ai/stacks/`. Root `stacks/` matches `profiles/` as a checkout-level cut.

Give each stack a manifest file. The folder is the definition.

## Consequences

Profiles that want the tracker name `heio-stack` instead of listing its skills, agents, and prompts. The installer reads `stacks/` as well as `ai/`. Edit stack files in `stacks/<name>/`, then reinstall.

## Relationships

- [[0023-pi-is-deprecated]]
- [[0004-source-pack-under-ai]]
- [[schema-profile]]
- [[spec-installer]]
- [[architecture-pack-and-packages]]
- [[architecture-heio-stack]]
