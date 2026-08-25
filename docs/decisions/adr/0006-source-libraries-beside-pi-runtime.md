---
id: "adr-6"
title: "ADR-0006: Source libraries sit beside the Pi runtime pack"
kind: adr
description: "Agents, skills, playbooks, and prompts are sibling libraries under ai/. ai/pi/ is runtime only."
status: accepted
domain: pack
area: decisions
tags: [pack, layout]
created_at: "2026-08-25"
updated_at: "2026-08-26"
---

# ADR-0006: Source libraries sit beside the Pi runtime pack

## Context

[[0004-source-pack-under-ai]] put the markdown pack under `ai/`. [[0005-pi-only-dest]] then said the OpenCode trees `ai/agents/` and `ai/prompts/` were gone, and that Pi identity lived under `ai/pi/agents/`.

That folded four libraries into the runtime pack. Edit paths, install language, and dest copies all pointed at `ai/pi/` for things that are not Pi runtime.

The checkout already keeps those libraries as siblings. `AGENTS.md` names that tree.

## Decision

Honor this source layout:

- `ai/agents/` is the agent library.
- `ai/skills/` is the skill library.
- `ai/playbooks/` is the playbook library.
- `ai/prompts/` is the prompt/command library.
- `ai/pi/` is the Pi runtime pack. Prompts, skills, agents, and roles do not live here. Dest identity is only `.pi/agents/`.
- `profiles/` is the install profiles.
- `scripts/` is the checks and the profile module.
- `packages/installer/` is the `agentic-core` CLI.

Dest is still `.pi/`. This note does not reopen [[0005-pi-only-dest]].

## Alternatives considered

Keep identity and prompts under `ai/pi/`. That matches the old installer reads. It hides the libraries behind a runtime folder and fights the tree already on disk.

Treat `ai/agents/` and `ai/prompts/` as a second dest. Dest is `.pi/`. Those folders are source libraries, not install output.

## Consequences

Edit agents in `ai/agents/`, prompts in `ai/prompts/`, skills in `ai/skills/`, playbooks in `ai/playbooks/`. `ai/pi/` holds runtime files only.

The folder list inside [[0004-source-pack-under-ai]] is stale. The claim in [[0005-pi-only-dest]] that source identity lives under `ai/pi/agents/` is superseded.

Dest identity is only `.pi/agents/`. There is no dest `.pi/roles/` tree. Install deletes a leftover dest roles directory. Spawn uses `--agent`. Dest prompts are still `.pi/prompts/`.

## Relationships

- [[glossary]]
- [[architecture-pack-and-packages]]
- [[spec-pi-agent-system]]
- [[0004-source-pack-under-ai]]
- [[0005-pi-only-dest]]
