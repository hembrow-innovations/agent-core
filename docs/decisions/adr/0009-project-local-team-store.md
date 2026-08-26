---
id: "adr-9"
title: "ADR-0009: team runtime lives in project .draconic"
kind: adr
description: "Team roster, member records, and the task board live under the project .draconic/teams tree."
status: accepted
domain: pack
area: teams
tags: [teams, adr]
created_at: "2026-08-26"
updated_at: "2026-08-26"
---

# ADR-0009: team runtime lives in project .draconic

## Context

Teams stored runtime under `$PI_TEAMS_DIR` or `~/.pi/teams`. That is user-global. A teammate was also one name used as `--cname`, `--name`, and `--agent`, so two builders could not share one agent definition. After a task the live JSONL was the only memory. Pi has no in-place flush a lead can trigger.

## Decision

Default team runtime is `<cwd>/.draconic/teams/<team>/`. `PI_TEAMS_DIR` still overrides. Old `~/.pi/teams` files are not migrated.

A teammate is an instance of an agent definition. `--cname` is the unique instance name. Optional spawn `agent` is the dest `.pi/agents/` file. `builder-1` and `builder-2` may share `builder`.

Each instance has a member record under `roster/<cname>/`. `identity.md` is standing. `log.tsv` is the event index. `handoff.md` is the latest restore card. Live `paneId` and status stay on `config.json`.

Working context is the JSONL. The lead drops it by shutdown then spawn of the same `--cname`. The new process reads identity and the last handoff. The teammate does not wipe itself.

## Alternatives considered

Keep `~/.pi/teams` and only add logs under `.draconic`. Identity would still be global and easy to attach to the wrong checkout.

Give the model a flush tool or auto-wipe on `task_complete`. Both fire at the wrong time. Event handlers cannot `navigateTree`.

Treat `/new` or `/compact` as a task reset. `/new` drops the file and can rename the coms bind. `/compact` keeps a summary.

## Consequences

Team files are gitignored with the rest of `.draconic/`. A clone does not see them. Management `layout-folder` must name `teams/` as reserved.

Spawn, adopt, and shutdown stay in `packages/draconic-teams`. Spec: [[spec-tmux-agent-teams]].

## Relationships

- [[spec-tmux-agent-teams]]
- [[glossary]]
- [[0005-pi-only-dest]]
