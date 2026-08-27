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
updated_at: "2026-08-26"
---

# Teams purpose

## Job

Let a human watch named Pi sessions work in tmux panes, talk to them, and share a claimable task list.

```ts
// packages/draconic-teams/src/index.ts — team_spawn
description:
 "Reconcile a named teammate pane. A live matching pane is adopted. Requires tmux.",
```

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

- `/team create|spawn|status|task|shutdown` in a trusted Pi session inside tmux
- Tools `team_create`, `team_spawn`, `team_status`, `team_shutdown`, `task_create`, `task_list`, `task_get`, `task_claim`, `task_complete`
- `node scripts/try-teams.mjs`

## Authority

- Behaviour: [[spec-tmux-agent-teams]]
- Mailbox: [[architecture-draconic-coms]]
- Pack layout: [[architecture-pack-and-packages]]

## Open product questions

- (none)
