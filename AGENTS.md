# agent-core

This repo is the skill and profile pack. Install copies skills into a dest tree. Edit the source.

## Source

- `ai/skills/` is the skill library.
- `ai/playbooks/` is the playbook library.
- `ai/pi/` is the Pi runtime pack.
- `ai/agents/` and `ai/commands/` are the OpenCode pack.
- `profiles/` is the install profiles.
- `scripts/` is the checks and the profile module.
- `packages/installer/` is the `agentic-core` CLI.

## Dest

`.pi/` and `.opencode/` are generated and gitignored. Do not edit copies there.

After you change a source skill, reinstall:

```
pnpm exec agentic-core install . --profile agentic-core
```

When you write or edit a skill, read `ai/skills/engineering/write-a-skill/SKILL.md`.

## Verify

```
pnpm test
pnpm run typecheck
```

## Pi

The local profile is `profiles/agentic-core.yaml`. It is the skill list for developing this pack, not an export profile.

Run `pi` in this directory. Trust the folder. Then `/draconic-mode`.
