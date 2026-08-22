# Draconic index (Pi)

Installed from agent-core `pi/`.
Loaded by Pi from `.pi/skills/`, `.pi/prompts/`, `.pi/extensions/`, and `.pi/APPEND_SYSTEM.md`.

## Entry

| Slash | Path |
|---|---|
| `/draconic-mode` | `.pi/prompts/draconic-mode.md` |
| `/setup-draconic` | `.pi/prompts/setup-draconic.md` |
| `/orchestrate` | `.pi/prompts/orchestrate.md` |
| `/skill:draconic-mode` | `.pi/skills/draconic-mode/SKILL.md` |

## Skills

architect · arena · automate-me · blast-radius · bro · comment-sicko · create-verification-skill · figure-it-out · how · interrogate · maintain-verification-skill · no-comments · draconic-mode · recall · reflect · setup-draconic · show-me-your-work · swarm · tdd · teach · technical-writing · typescript-best-practices · unslop · why · plus 21 `principle-*` leaves

## Playbooks (`draconic-mode/playbooks/`)

investigation · bug-fix · perf-issue · hillclimb · runtime-forensics · trace-forensics · feature · refactoring · prototype · visual-parity · authoring-a-skill · eval · babysit · shipping · autonomous-run · orchestrate · autopilot-full · autopilot-stack · session-pickup · pause-safely · multi-phase-plan · worktree-cleanup · opening-a-pr

Degraded on Pi until spawn covers them: autopilot-full, autopilot-stack, orchestrate-as-cloud, Graphite shipping.

## Extensions

| File | Role |
|---|---|
| `.pi/extensions/draconic-spawn.ts` | `draconic_spawn` and `draconic_todo` |
| `.pi/extensions/draconic-boot.ts` | Footer status |

## Project-local after install

| Path | Role |
|---|---|
| `.pi/skills/verify-<app>/` | Project prove path |
| `.pi/draconic-models.md` | Per-role model map |
| `.pi/APPEND_SYSTEM.md` | Sticky draconic boot |
| `AGENTS.md` | Authority for engine, layout, hard stops |
| `WORKFLOW.md` | How operators drive this project |
| `.draconic/` | Todos, decisions, worktrees, child sessions |
