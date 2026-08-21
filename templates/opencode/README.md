# OpenCode templates

Written into a target project when installing the **pstack** profile (only if missing, unless noted).

| Template | Destination | Policy |
|----------|-------------|--------|
| `opencode.json` | `opencode.json` | skip if exists |
| `rules/pstack-models.md` | `.opencode/rules/pstack-models.md` | overwrite on pstack install |
| `WORKFLOW.md` | `WORKFLOW.md` | skip if exists |
| `PSTACK-INDEX.md` | `PSTACK-INDEX.md` | overwrite on pstack install |

Agents and commands are always overlaid from `agents/` and `commands/`.
