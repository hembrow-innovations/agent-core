# Draconic for Pi

Pi coding harness. Playbooks, principles, slash prompts, and a spawn tool. Not poteto. Not pstack.

## Install into a project

From this checkout:

```bash
node pi/install.mjs /path/to/project
```

From the project directory:

```bash
node /path/to/agent-core/pi/install.mjs
```

Then:

```bash
cd /path/to/project
pi
```

Trust the folder when Pi asks. Run `/draconic-mode`. Optional: `/setup-draconic`, `/create-verification-skill`.

You can also `pi install -l /path/to/agent-core/pi` for skills, prompts, and extensions only. The script still owns `APPEND_SYSTEM.md`, `AGENTS.md`, and `WORKFLOW.md`.

## What lands

| Source | Destination |
|---|---|
| `skills/` | `.pi/skills/` and `.agents/skills/` |
| `prompts/` | `.pi/prompts/` |
| `extensions/` | `.pi/extensions/` |
| `APPEND_SYSTEM.md` | `.pi/APPEND_SYSTEM.md` if missing |
| `draconic-models.md` | `.pi/draconic-models.md` |
| `AGENTS.md` | project `AGENTS.md` if missing |

## Daily loop

`/draconic-mode` matches a playbook. TDD first. Prove it on the real app. `/interrogate` when contested. `/unslop` the PR body.

Fan-out (arena, swarm, interrogate, feature delegates) uses `draconic_spawn`. Without it, those steps run in-process. Autopilot and Graphite cloud drains stay degraded.

See installed `WORKFLOW.md` and `DRACONIC-INDEX.md`.
