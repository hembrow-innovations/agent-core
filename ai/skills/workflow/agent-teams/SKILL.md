---
name: agent-teams
description: Team living Pi TUI panes in tmux. Use when the user wants a team, named teammates, or tmux agent panes. Use pi-subagents for parent-owned children.
---

# Agent teams

A **team** is a lead Pi session plus named living **teammate** TUIs in tmux. The human can click a pane and type. They talk on coms and claim tasks.

If the human does not need to watch or type into those panes, stop and use **pi-subagents**. A **child** is parent-owned, not a TUI, and exits when the task ends. Swarm, arena, and orchestrate stay there.

## Lead session

Spawn and shutdown need `$TMUX`. If it is empty, stop. This lead has to run inside tmux.

Team name is the bound coms `--project`. Member name is `--cname`. After bind, the system prompt says `You are coms peer <cname> on project <team>`. That is identity. It is not in `PI_*`, not in `pi --name`, and not in `/session`.

If the prompt says `coms is not bound`, or the name is `agent-*`, the flags never reached this process. Stop and have the user start `pi --project <team> --cname team-lead` inside tmux.

If the user asks for a different team name, keep this bound project. Create, spawn, and talk on it. Say the bound name once.

Names match `^[A-Za-z0-9_-]+$` and stay at most 64 characters. `team-lead` is reserved for the lead.

Done when this session is inside tmux and the system prompt names the bound project.

## Roster

If `team_status` lists this team, skip create. If it says `no team file yet` for the bound project, `team_create` with that bound name. `no team. /team create` with no project means the flags never reached this process. One team per lead session.

`team_spawn` each teammate. Purpose is what they are for. Name is `--cname` and `--agent`. Prefer names that match dest `.pi/agents/` files. A second spawn of the same name adopts a live pane or replaces a dead one. Default is a split pane. Set `useWindows` only when the user asked for a window.

Share the team cwd.

Done when `team_status` lists every requested teammate.

## Work

`task_create` each unit. `description` is what done looks like. Put open dependencies in `blockedBy`.

`coms_list`. You appear as `this-session`. Wait until every spawned teammate appears. Only you after that wait means those panes bound to another project: `team_shutdown` them and `team_spawn` again on this team.

`coms_send` the job. Tell them to `task_claim` an unblocked pending task, do the work, `task_complete` it, reply, and stay ready. Then `coms_await`.

Inbound `idle: <name> settled` means that teammate is free. Send more work or shut them down.

Claim fails when the task is not pending or a blocker is still open. Complete drops this id from other tasks' `blockedBy`.

Done when every task is completed or still owned on purpose, and every idle teammate has been given work or shut down.

## Shutdown

`team_shutdown` each teammate before you leave, unless the user wants the panes left up. A missing pane is a no-op.

Done when `team_status` matches that, or the user still wants them live.
