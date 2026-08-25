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
updated_at: "2026-08-26"
---

# Tmux agent teams

## Goal

A lead Pi session can spawn named teammate TUIs in tmux panes. They talk on existing coms. They claim locked task files. The human can click a pane and type.

## Requirements

- Source lives in `packages/draconic-teams`. Dest receives a vendor copy.
- `/team` plus tools `team_create`, `team_spawn`, `team_status`, `team_shutdown`, `task_create`, `task_list`, `task_get`, `task_claim`, and `task_complete`.
- Default spawn is `tmux split-window`. `applySpawn` sets `memberCount` to roster size plus one on start, and to the current roster length on replace. Odd count stays vertical. Even count below 10 adds `-h`. Even count 10 or more adds `-h -t {right}`. `team_spawn` may pass `useWindows` and then opens `tmux new-window` instead.
- Spawned `pi` gets `--cname`, `--purpose`, `--project <team>`, `--name`, and `--agent <name>`. Optional `--model` follows when `team_spawn` is given a model.
- Team name is the coms `--project`. Member name is `--cname`.
- `--project` and `--cname` are not registered by teams. `flagString` reads `pi.getFlag`, then walks `process.argv`. Mailbox: [[architecture-draconic-coms]].
- Runtime is `$PI_TEAMS_DIR/<team>/` or `~/.pi/teams/<team>/`. Roster is `config.json`. Tasks are `tasks/<id>.json`. The board lock is `tasks/.lock`.
- Spawn is a reconcile. A second spawn of the same name adopts a live pane or replaces a dead one. Spawning the lead name as a teammate fails.
- Claim is compare-and-set under `withBoardLock`. A leftover `tasks/.lock` whose pid is dead is unlinked first.
- Teammate `agent_settled` writes status `idle` and sends the lead `idle: <name> settled` through `sendComsPrompt`. An inbound `coms-inbound` message writes status `working`.
- Shutdown sends a coms stop prompt, waits 400ms, then `killPane`. A missing pane is `absent`. A name that is not a teammate is `absent`.
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

### Identity flags

Teams never calls `registerFlag`. `flagString` is the only reader.

```ts
// packages/draconic-teams/src/index.ts — flagString
function flagString(pi: ExtensionAPI, name: string): string | undefined {
 const fromFlag = pi.getFlag(name);
 if (typeof fromFlag === "string" && fromFlag.length > 0) return fromFlag;
 return argvString(name);
}
```

Missing `--cname` becomes `team-lead` through `ownerName`. `parseMemberName` with role `teammate` rejects that reserved name, then the lead parse accepts it.

`team_status` with a project flag and no roster file reports `project <name>, cname <name>. no team file yet.` The leadless error `no team. /team create <name> first.` is only when no project flag is set.

### Roster

`Team` is `{ name, leadName, cwd, createdAt, members }`.
`Member` is a lead or a teammate. The lead has no purpose or pane. A teammate has `purpose`, `paneId`, and `status` of `spawned | working | idle | shutdown`.
Names match `^[A-Za-z0-9_-]+$` and stay at most 64 characters. `team-lead` is reserved for the lead.

`createTeam` writes one lead member and replaces `config.json` if the name already exists.

`setMemberStatus` no-ops when the member is missing, is the lead, is already `shutdown`, or already has that status.

### Spawn layout

`buildPiArgv` never adds `--mode` or `rpc`.

```ts
// packages/draconic-teams/src/tmux.ts — buildTmuxSpawnArgs
const tmux = ["tmux", "split-window"];
const memberCount = request.memberCount ?? 1;
if (memberCount % 2 === 0) tmux.push("-h");
tmux.push("-dP", "-F", "#{pane_id}");
if (memberCount % 2 === 0 && memberCount >= 10) tmux.push("-t", "{right}");
```

`applySpawn` throws when `TMUX` is empty. A live matching pane returns `adopt`. A dead recorded pane starts again as `replace`. A new name starts as `start`.

`useWindows` builds `tmux new-window -dP -F #{pane_id} -n @pi-team | <name>`. `/team spawn` does not pass that flag. `team_spawn` does.

### Tasks

`Task` is `{ id, subject, description, status, owner, blockedBy }`.
Ids start at `1` and match `^[1-9][0-9]*$`. Status is `pending | in_progress | completed`.
`task_create` can pass `blockedBy`. `/team task create` uses the rest of the line as both subject and description and does not set blockers.

`withBoardLock` exclusive-creates `tasks/.lock`, writes this pid, then runs the mutation.

```ts
// packages/draconic-teams/src/store.ts — claimTask
if (task.status !== "pending") {
 throw new Error(`task ${id} is not pending`);
}
const blocked = incompleteBlockers(input.teamsDir, team.name, task);
if (blocked.length > 0) {
 throw new Error(`task ${id} is blocked by ${blocked.join(", ")}`);
}
```

Claim fails when the task is not pending or a blocker is still open. The reserved lead name may claim. Complete writes `completed` and drops this id from other tasks' `blockedBy` lists. `addBlockedBy` rejects a cycle.

A stale `tasks/.lock` whose pid is dead does not brick a later claim. A leftover `1.json.lock` is ignored. The live lock is the board file.

### Shutdown and idle

`shutdownMember` looks up a teammate, sends `Please stop. The lead is shutting this pane down.` through `sendComsPrompt`, waits 400ms, then `killPane`. `killPane` returns `killed` or `absent`. The roster status becomes `shutdown` either way when the member existed.

`agent_settled` only notifies when `findMember` returns a teammate. The send target is `team.leadName`. A missing lead on coms is swallowed.

## Acceptance

- Dest `.pi/vendor/@agentic-core/draconic-teams` exists after `pnpm exec agentic-core install . --profile agentic-core`
- `pnpm --filter @agentic-core/draconic-teams test` is green
- `pnpm --filter @agentic-core/draconic-coms test` is green
- `pnpm run typecheck` is clean
- Inside tmux, `bash scripts/try-teams.sh` artifacts show pong, one claimed task, and no leftover pane
- No `--mode rpc`. No `tmux send-keys`. No second mailbox

## Open questions

- (none)
