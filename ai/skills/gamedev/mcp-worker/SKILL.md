---
name: mcp-worker
description: >
  Route Blender and Godot MCP work into specialist workers with a structured handback.
  Use when a heio parent needs MCP, when spawning blender-mcp/godot-mcp, or when
  writing/reading MCP evidence under docs/log/reporting.
---

# MCP worker routing

Keep Blender MCP and Beckett (Godot) MCP off the default coding agent. Workers own the full loop and return a contract plus on-disk evidence.

Pi reaches MCP through **pi-mcp-adapter** (`mcp` proxy tool). Discover with `mcp({ search })`, then call `mcp({ tool, args })`. Do not expect OpenCode `blender*` / `godot*` tool names.

## Parent rules (heio-builder, heio-slice, AFK orchestrator)

- Never call Beckett or Blender MCP inline from a lean parent.
- Spawn via `subagent`:
  - agent `blender-mcp` for Blender (port 9876, mesh/export/art).
  - agent `godot-mcp` for Beckett/Godot editor MCP (`http://127.0.0.1:8770/mcp`).
- One MCP worker at a time per live Blender instance and per live Godot editor. No parallel swarm on the same app.
- Continue from the handback. Read evidence paths selectively. Do not re-dump MCP trees into parent context.

## Worker rules

- Run inspect → mutate → verify entirely inside the worker.
- Godot worker default Beckett effort **L2** (author) or **L3** (run). **L4** only for screenshots / remote tree. Confirm with dock + `doctor`.
- Blender worker loads `blender-high-fidelity` for craft rules.
- Prefer server-scoped search (`godot` / `beckett` / `blender`) before calling a tool.

## Handback contract

Every worker final message (and optional report file) must include:

- **status**: `done` | `blocked` | `needs_human`
- **goal**: one line, what was asked
- **changes**: files, scenes, assets, node paths touched
- **evidence**: repo-relative paths to screenshots, logs, glb, reports
- **verify**: commands or MCP checks run and pass/fail
- **residuals**: still wrong, unproven, or out of scope (`none` if empty)
- **next**: one concrete next step for the parent

### Rules

- No `status: done` without at least one evidence path or a named verify command result.
- `status` is exactly one of `done` | `blocked` | `needs_human`.
- Screenshots and large trees stay in the worker or on disk.
- Prefer one complete loop per spawn.
- Parent rejects vague handbacks and re-spawns or resumes the worker.

### Shape example

```markdown
status: done
goal: Export scarecrow_mortar LOD0 glb and smoke-import path note
changes:
  - assets/environment/towers/scarecrow_mortar/scarecrow_mortar.glb
evidence:
  - assets/environment/towers/scarecrow_mortar/previews/qa-elevated.png
verify:
  - blender get_scene_info + export: pass
  - file exists on disk: pass
residuals: none
next: Parent runs Godot import smoke only if runtime bind is in scope; else stop
```

## Evidence root

- **Handback / measurement report**: `docs/log/reporting/<YYYY>/<MM>/mcp-handback-<slug>.md`
- **Asset QA images**: beside the asset under `assets/**/previews/` when asset-scoped
- **Ad-hoc session dumps**: `docs/log/reporting/<YYYY>/<MM>/` only; do not dump into parent chat

Date folders use the session calendar date. Slug is short kebab-case for the unit.
