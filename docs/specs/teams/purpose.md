---
id: "purpose-teams"
title: "Teams purpose"
kind: purpose
description: "Visible Pi teammate panes that talk on coms and share locked tasks."
status: active
domain: pack
area: teams
tags: [purpose, pi, tmux]
created_at: "2026-08-24"
updated_at: "2026-08-24"
---

# Teams purpose

## Job

Let a human watch named Pi sessions work in tmux panes, talk to them, and share a claimable task list.

## In scope

- Spawn and adopt named TUI panes
- Talk on existing coms
- Locked task files
- Idle ping and requested shutdown

## Out of scope

- A second mailbox
- RPC teammates
- Claude MCP wrapping
- Nested teams
- Worktrees

## Surfaces

- `/team` in a trusted Pi session inside tmux
- Tools `team_*` and `task_*`
- `bash scripts/try-teams.sh`

## Authority

- Behaviour: [[spec-tmux-agent-teams]]
- Pack layout: [[architecture-pack-and-packages]]

## Open product questions

- (none)
