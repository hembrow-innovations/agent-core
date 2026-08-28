---
id: "adr-3"
title: "ADR-0003: default agent definition on each Pi start"
kind: adr
description: "A new Pi process attaches the default dest .pi/agents/ file. The last switch does not persist."
status: superseded
domain: agents
area: decisions
tags: [pi, agents]
created_at: "2026-08-24"
updated_at: "2026-08-25"
---

# ADR-0003: default agent definition on each Pi start

Superseded by [[0007-agent-attach-is-opt-in]]. Cold start attaches nothing.

## Context

An earlier note wanted a cold start with no persona. Trusted-folder `APPEND_SYSTEM.md` made every session heio. The competing switcher drafts then split. Compiled toggle. Presets. An open-agents fork.

The destination still needs an identity on the first turn. An empty coding-assistant prompt plus a 21 KB ritual is the bug we are leaving. A remembered last switch would make two `pi` processes in the same folder disagree after a restart.

## Decision

Each new Pi process attaches the default agent definition from dest `.pi/agents/`. The pack file lives in `ai/agents/`. The primary switch can change the file for that process. The next process starts on the default again. The last pick is not written to disk.

The default is a dest `.pi/agents/` file, not `APPEND_SYSTEM.md` and not a compiled string inside boot.

## Alternatives considered

Empty start. No definition until the human switches. Matches the old opt-in note. The first turn has no identity and will grow another boot ritual to compensate.

Persist the last switch in dest settings or a flag file. Restart would restore `/agent researcher` after a crash. Two panes in one folder would also inherit that pick. Harder to reason about.

Always-on `APPEND_SYSTEM.md`. That is today's behaviour. It is not a switch.

## Consequences

Boot is simple. In-memory flag plus a known default file. Operators who want a different everyday identity change the default file in the pack, not a leftover session flag.

A teammate that was switched mid-process comes back as the default after restart. Spawn must pass the definition name if that member should stay specialised.

## Relationships

- [[glossary]]
- [[spec-pi-agent-system]]
- [[0006-source-libraries-beside-pi-runtime]]
- [[0007-agent-attach-is-opt-in]]
