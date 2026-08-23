# agent-core

Portable AI agent skills, commands, and preferences. Drop into any project for OpenCode, Claude Code, and GitHub Copilot.

Includes a vendored **pstack** pack (poteto-mode, playbooks, principles) with an **OpenCode** adapter (agents + slash commands), shaped after a live Godot monorepo install but kept project-agnostic.

## Install (into a project)

From the project directory:

```bash
curl -fsSL https://raw.githubusercontent.com/hembrow-innovations/agent-core/main/scripts/install.mjs | node - --profile core
```

Profiles live in `profiles/*.yaml`. A profile lists skills and, when it sets `mode`, which playbooks install copies into `{mode}-mode`.

| Profile | Contents |
|---------|----------|
| `core` | Engineering skills and prefs. Default. No playbook overlay. |
| `web` | `core` plus `playwright-cli` and `react-testing`. No playbook overlay. |
| `mobile` | `core` plus `maestro` and `react-testing`. No playbook overlay. |
| `pstack` | pstack skills, `poteto-mode`, every playbook, agents, commands, templates |
| `godot` | `pstack` plus `godot-mono` |
| `full` | Union of core, pstack, and the extra skills. Every playbook. |
| `life-engine` | `draconic-mode` plus investigation, feature, bug-fix, refactoring, and opening-a-pr |

```bash
# pstack / poteto on OpenCode
curl -fsSL …/install.mjs | node - --profile pstack

# Godot mono project
curl -fsSL …/install.mjs | node - --profile godot

# from a local clone
node /path/to/agent-core/scripts/install.mjs /path/to/project --profile pstack --local /path/to/agent-core
```

### What gets written

| Source | Destination |
|--------|-------------|
| `skills/**/<name>/`, `pstack/skills/<name>/`, or `pi/skills/<name>/` | `.opencode/skills/<name>/` and `.claude/skills/<name>/` |
| `playbooks/<id>.md` | `{mode}-mode/playbooks/` when the profile selects playbooks |
| `agents/*.md` | `.opencode/agent/` (pstack/godot/full) |
| `commands/*.md` | `.opencode/command/` (pstack/godot/full) |
| `templates/opencode/*` | `opencode.json`, `.opencode/rules/pstack-models.md`, `WORKFLOW.md`, `PSTACK-INDEX.md` |
| `preferences/AGENTS.md` | `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` **only if missing** |

Skills and pstack agents/commands are overlaid by name. Project-local skills (e.g. `verify-myapp`) are left alone.

### After pstack install

1. Fill in project `AGENTS.md` (engine, layout, hard stops).
2. `opencode` → agent **poteto** or `/poteto-mode`.
3. `/setup-pstack` to set model roles (defaults are `inherit-parent`).
4. Optional: `/create-verification-skill` for a project prove path.

See installed `WORKFLOW.md` and `PSTACK-INDEX.md`.

## Layout

```
skills/              # SKILL.md playbooks (nested by domain)
pstack/              # vendored upstream pstack (skills, agents, guide)
pi/                  # Pi adapter, including draconic-mode
playbooks/           # playbook library. profiles select from here
profiles/            # install profiles (*.yaml)
agents/              # OpenCode agent defs (poteto, poteto-agent, comment-sicko)
commands/            # OpenCode slash commands
templates/opencode/  # opencode.json, rules, WORKFLOW, index
preferences/         # AGENTS.md stub
scripts/install.mjs
scripts/profile.mjs
```

## License

MIT. Vendored upstream: see `NOTICE`.
