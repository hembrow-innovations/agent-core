---
id: "spec-tmux-agent-teams"
title: "Tmux agent teams"
kind: spec
description: "Named Pi TUI panes in tmux talk on coms and share locked task files."
status: active
domain: pack
area: teams
tags: [spec, pi, tmux]
created_at: "2026-08-24"
updated_at: "2026-08-24"
---

# Tmux agent teams

## Goal

A lead Pi session can spawn named teammate TUIs in tmux panes. They talk on existing coms. They claim locked task files. The human can click a pane and type.

## Requirements

- Source lives in `packages/draconic-teams`. Dest receives a vendor copy.
- `/team` plus tools for create, spawn, status, tasks, and shutdown.
- Default spawn is `tmux split-window`. Windows sit behind a flag.
- Spawned `pi` gets `--cname`, `--purpose`, `--project <team>`, `--name`, `--agent <name>`. Boot uses that dest file when it exists. Otherwise the default file.
- Team name is the coms `--project`. Member name is `--cname`.
- Runtime is `$PI_TEAMS_DIR/<team>/` or `~/.pi/teams/<team>/`.
- Spawn is a reconcile. A second spawn of the same name adopts a live pane or replaces a dead one.
- Claim is compare-and-set under a lock file.
- Teammate `agent_settled` sends the lead a short idle note over coms.
- Shutdown sends a coms stop request, then `tmux kill-pane`. A missing pane is a no-op.
- Reviewer bar is `bash scripts/try-teams.sh` inside tmux.

## Non-goals

- A second mailbox beside coms
- `--mode rpc` teammates
- `tmux send-keys`
- Wrapping `claude-code-teams-mcp` or state under `~/.claude`
- Nested teams or more than one team per lead session
- Git worktrees
- Killing teammates when the lead session ends

## Behaviour

`Team` is `{ name, leadName, cwd, createdAt, members }`.
`Member` is a lead or a teammate. The lead has no purpose or pane. A teammate has `purpose`, `paneId`, and `status` of `spawned | working | idle | shutdown`.
Names match `^[A-Za-z0-9_-]+$` and stay at most 64 characters. `team-lead` is reserved for the lead.

`Task` is `{ id, subject, description, status, owner, blockedBy }`.
Ids start at `1`. Status is `pending | in_progress | completed`.
Claim fails when the task is not pending or a blocker is still open.
Complete drops this id from other tasks' `blockedBy` lists.

If a coms message does not wake the teammate TUI, the product failed. `read_inbox` is a fail.

## Acceptance

- Dest `.pi/vendor/@agentic-core/draconic-teams` exists after `pnpm exec agentic-core install . --profile agentic-core`
- `pnpm --filter @agentic-core/draconic-teams test` is green
- `pnpm run typecheck` is clean
- Inside tmux, `bash scripts/try-teams.sh` artifacts show pong, one claimed task, and no leftover pane
- No `--mode rpc`. No `tmux send-keys`. No second mailbox

## Open questions

- (none)
