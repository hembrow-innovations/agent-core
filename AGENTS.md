# agent-core

This repo is the skill and profile pack. Install copies skills into a dest tree. Edit the source.

## Rules

- Markdown: never tables — use `- **{text}**: {text}`
- for scripting only use js/mjs

## Source

- `ai/agents/` is the agent library.
- `ai/skills/` is the skill library.
- `ai/playbooks/` is the playbook library.
- `ai/prompts/` is the prompt/command library.
- `ai/pi/` is the Pi runtime pack. (prompts,skills,agents,roles, don't live in this directory)
- `profiles/` is the install profiles.
- `scripts/` is the checks. Profile parse lives in `packages/installer`.
- `packages/installer/` is the `agentic-core` CLI.

## Dest

`.pi/` is generated and gitignored. Do not edit copies there. Identity dest is `.pi/agents/`. There is no dest roles tree.

After you change a source skill, reinstall:

```
pnpm exec agentic-core install . --profile agentic-core
```

When you write or edit a skill, read `ai/skills/engineering/create-skill/SKILL.md`.

## Verify

```
pnpm test
pnpm run typecheck
```

## Pi

The local profile is `profiles/agentic-core.yaml`. It is the skill list for developing this pack, not an export profile.

Run `pi` in this directory. Trust the folder.
