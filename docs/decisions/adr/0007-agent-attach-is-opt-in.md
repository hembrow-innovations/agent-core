---
id: "adr-7"
title: "ADR-0007: agent attach is opt-in"
kind: adr
description: "A new Pi process attaches no agent. /agent and --agent are the only attach path."
status: accepted
domain: agents
area: decisions
tags: [pi, agents]
created_at: "2026-08-25"
updated_at: "2026-08-25"
---

# ADR-0007: agent attach is opt-in

## Context

[[0003-default-agent-definition]] attached a dest `.pi/agents/` file on every Pi start. The pack file was `draconic`. That made every new process a draconic session even when nobody asked.

The empty-start alternative in that note was the right product. A coding-assistant first turn does not need a pack identity. The 21 KB ritual was `APPEND_SYSTEM` dumping dest `draconic-mode/SKILL.md`. That dump is already gone. The leftover default file still named the session draconic.

## Decision

A new Pi process attaches no agent definition. `/agent <name>` and `--agent <name>` attach a dest `.pi/agents/` file for that process only. `/agent off` and `/agent default` clear it. The last pick is not written to disk.

`draconic` is one pack file. It is not the cold-start identity. Using it is opt-in.

## Alternatives considered

Keep a default and change the file. Still a default. The next identity becomes the new always-on.

Persist the last switch in dest settings or a flag file. Restart would restore `/agent researcher` after a crash. Two panes in one folder would also inherit that pick.

Keep attaching `draconic` and tell people to switch off. The default is the path everyone hits.

## Consequences

First turn is the coding assistant plus `APPEND_SYSTEM`. Operators who want draconic type `/agent draconic` or pass `--agent draconic`.

Teammate spawn passes `--agent <name>` only when that dest file exists. A missing file means no agent, not a fallback to draconic. Team spawn that names `--agent <member>` still does so on purpose. Boot ignores a missing file.

This note supersedes the attach-on-start decision in [[0003-default-agent-definition]]. The rule that the last switch does not persist still holds.

## Relationships

- [[0003-default-agent-definition]]
- [[glossary]]
- [[spec-pi-agent-system]]
- [[spec-tmux-agent-teams]]
