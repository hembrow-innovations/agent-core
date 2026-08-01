# agent-core

Portable AI agent skills, commands, and preferences. Drop into any project for OpenCode, Claude Code, and GitHub Copilot.

## Install (into a project)

From the project directory:

```bash
curl -fsSL https://raw.githubusercontent.com/hembrow-innovations/agent-core/main/scripts/install.mjs | node -- --profile core
```

Profiles:

| Profile  | Contents                                      |
|----------|-----------------------------------------------|
| `core`   | Matt Pocock engineering/productivity set + prefs (default) |
| `web`    | `core` + `playwright-cli`                     |
| `mobile` | `core` + `maestro`                            |
| `full`   | everything                                    |

```bash
# examples
curl -fsSL …/install.mjs | node -- --profile web
curl -fsSL …/install.mjs | node -- --profile mobile --with handoff
curl -fsSL …/install.mjs | node -- --ref main --without wayfinder

# from a local clone
node /path/to/agent-core/scripts/install.mjs /path/to/project --profile full
```

### What gets written

| Source | Destination |
|--------|-------------|
| `skills/<name>/` | `.opencode/skills/<name>/` and `.claude/skills/<name>/` |
| `preferences/AGENTS.md` | `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` **only if missing** |

Skills are overlaid by name (re-install overwrites those skill folders). Other skills in the project are left alone.

## Layout

```
skills/          # SKILL.md playbooks (vendored + local)
commands/        # empty (v1)
agents/          # empty (v1)
preferences/     # AGENTS.md stub
mcp/ hooks/ plugins/ themes/ keybinds/  # empty (v1)
scripts/install.mjs
```

## License

MIT. Vendored upstream skills: see `NOTICE`.
