---
id: "adr-4"
title: "ADR-0004: Source pack lives under ai/"
kind: adr
description: "Harness markdown and stubs live under ai/. Profiles and TypeScript packages stay at root."
status: accepted
domain: pack
area: decisions
tags: [pack, layout]
created_at: "2026-08-24"
updated_at: "2026-08-24"
---

# ADR-0004: Source pack lives under ai/

## Context

The source pack sat at the checkout root: `skills/`, `playbooks/`, `pi/`, `agents/`, `commands/`, plus empty stubs for plugins, hooks, keybinds, mcp, and themes. `packages/` already holds TypeScript products. Root was getting two kinds of tree mixed with docs, tests, and scripts.

[[0001-pnpm-workspace-pi-packages]] already refused to turn skills into packages. Dest still needs `.pi/skills` and `.opencode/skills`. The question is only where this checkout keeps the source.

## Decision

Move the markdown pack under `ai/`. Keep current folder names inside it.

```text
ai/skills
ai/playbooks
ai/agents
ai/commands
ai/pi
ai/plugins
ai/hooks
ai/keybinds
ai/mcp
ai/themes
```

`profiles/` stays at the checkout root. It is the install selector, not pack content. `packages/` stays TypeScript. Dest layout does not change.

Installer `srcRoot` stays the checkout. Pack reads use `ai/`.

## Alternatives considered

Put the pack inside `packages/`. That mixes markdown with `@agentic-core/*` and undoes [[0001-pnpm-workspace-pi-packages]].

Name the folder `pack/`. Accurate, but the chosen name is `ai/`.

Rename `skills` to `prompts` and `agents` to `mcp`. Those words mean other things. Dest still says skills.

Keep the pack at root. That leaves the original clutter.

## Consequences

Edit `ai/skills/`, then reinstall. Checks and the profile module resolve pack files through `ai/`. Dest projects do not see this path.

## Relationships

- [[glossary]]
- [[architecture-pack-and-packages]]
- [[0001-pnpm-workspace-pi-packages]]
