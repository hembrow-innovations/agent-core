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
- `deprecated/` is parked code and skills. Not installed. Not in the workspace.
- `profiles/` is the install profiles.
- `scripts/` is the npm entrypoints (`test`, `typecheck`). Do not put checks or tests here.
- `tests/` is the repo checks and tests. Profile parse lives in `packages/installer`. Package tests stay next to their source under `packages/`.
- `packages/installer/` is the `agentic-core` CLI.

## Dest

`.pi/` is generated and gitignored. Do not edit copies there. Identity dest is `.pi/agents/`. There is no dest roles tree.

After you change a source skill, reinstall:

```
pnpm exec agentic-core install . --profile agentic-core
```

When you write or edit a skill, read `ai/skills/engineering/create-skill/SKILL.md`.

## Tracker

This checkout runs **heio-stack**. Live work lives under `.heio/planning/` (intent, locations, sprints, slices), `.heio/tickets/`, and `.heio/archive/`. Git ignores `.heio/`. `docs/` stays the committed source of truth.

Session checklists stay on the `todo` tool (`@inobit/pi-todo`, session branch). Do not write `.heio/TODO.md` or `.heio/sessions/*/TODO.md`. Do not treat those files, `.heio/inbox/`, or `.heio/planning/plans/` as the tracker.

Chart intent, locations, and sprints with **heio-wayfinder**. Plan a slice or ticket with **heio-planning**. Execute a frozen slice with **heio-slice**. Every output ends `VERDICT: TASK | TICKET | ESCALATE | VERIFY`.

## Verify

Repo checks live under `tests/checks/`. Repo tests live under `tests/<area>/`. `scripts/test.mjs` and `scripts/typecheck.mjs` are the only npm entrypoints.

```
pnpm test
pnpm run typecheck
```

## Pi

The local profile is `profiles/agentic-core.yaml`. It is the skill list for developing this pack, not an export profile. It also installs the heio-stack skills so this checkout can run the loop.

Run `pi` in this directory. Trust the folder.
