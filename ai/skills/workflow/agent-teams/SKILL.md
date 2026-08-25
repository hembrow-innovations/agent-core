---
name: agent-teams
description: Team living Pi TUI panes in tmux. Use when the user wants a team, named teammates, or tmux agent panes. Use pi-subagents for parent-owned children.
---

# Agent teams

A **team** is a lead Pi session plus named living **teammate** TUIs in tmux. The human can click a pane and type. They talk on coms and claim tasks.

If the human does not need to watch or type into those panes, stop and use **pi-subagents**. A **child** is parent-owned, not a TUI, and exits when the task ends. Swarm, arena, and orchestrate stay there.

## Lead session

Spawn and shutdown need `$TMUX`. If it is empty, stop. This lead has to run inside tmux.

Team name is the coms `--project`. Member name is `--cname`. This session must already be on that project, with a `--cname` (often `team-lead`). If it is not, stop and have the user start `pi --project <team> --cname team-lead` inside tmux.

Names match `^[A-Za-z0-9_-]+$` and stay at most 64 characters. `team-lead` is reserved for the lead.

Done when this session is inside tmux and its coms project is the team name.

## Roster

If `--project` already names this team, `team_status` and skip create. Otherwise `team_create` with that name. One team per lead session.

`team_spawn` each teammate. Purpose is what they are for. Name is `--cname` and `--agent`. Prefer names that match dest `.pi/agents/` files. A second spawn of the same name adopts a live pane or replaces a dead one. Default is a split pane. Set `useWindows` only when the user asked for a window.

Share the team cwd.

Done when `team_status` lists every requested teammate.

## Work

`task_create` each unit. `description` is what done looks like. Put open dependencies in `blockedBy`.

`coms_list`. Every teammate must appear. An empty list means this lead is on the wrong `--project`.

`coms_send` the job. Tell them to `task_claim` an unblocked pending task, do the work, `task_complete` it, reply, and stay ready. Then `coms_await`.

Inbound `idle: <name> settled` means that teammate is free. Send more work or shut them down.

Claim fails when the task is not pending or a blocker is still open. Complete drops this id from other tasks' `blockedBy`.

Done when every task is completed or still owned on purpose, and every idle teammate has been given work or shut down.

## Shutdown

`team_shutdown` each teammate before you leave, unless the user wants the panes left up. A missing pane is a no-op.

Done when `team_status` matches that, or the user still wants them live.
