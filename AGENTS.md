# agent-core

This repo is the skill and profile pack. Install copies skills into a dest tree. Edit the source.

## Rules

- Markdown: never tables — use `- **{text}**: {text}`
- for scripting only use js/mjs

## Source

- `ai/` is the pi agent files.
  - `ai/agents/` is the agent library.
  - `ai/skills/` is the skill library.
  - `ai/playbooks/` is the playbook library.
  - `ai/prompts/` is the prompt/command library.
  - `ai/system-prompts/` system prompt library.
- `frameworks/` frameworks for working with ai harness like the one in this repo.
- `deprecated/` is parked code and skills. Not installed. Not in the workspace.
- `profiles/` is the install profiles.
- `scripts/` is the npm entrypoints (`test`, `typecheck`). Do not put checks or tests here.
- `tests/` is the repo checks and tests. Profile parse lives in `packages/installer`. Package tests stay next to their source under `packages/`.
- `packages/installer/` is the `agentic-core` CLI.

## Dest

`.pi/` is generated. Do not edit copies there. Identity dest is `.pi/agents/`. There is no dest roles tree.

After you change a source skill, reinstall:

```
pnpm exec agentic-core install . --profile agentic-core
```

When you write or edit a skill, read `ai/skills/engineering/create-skill/SKILL.md`.

## Splits

One git repo. Products stay separate by folder, profile, and nouns. Do not mix them in code or instructions. Do not split remotes from a session; that is a map decision.

- **Pack**: skill, agent, playbook, and prompt libraries plus the installer. Source `ai/` and `profiles/`. Dest copy is `.pi/`.
- **Heio-stack**: the tracker. Skills under `ai/skills/heio-stack/` and `heio-*` agents. This checkout runs it. A dest only gets it if the profile lists it. The `management` skill is a different `.heio/` convention; it is not this checkout's tracker. `@agentic-core/heio-coord` is parked; do not install or call `heio_stack`.
- **Hivemind**: out-of-session predicate machine. Source `frameworks/hivemind/`. Dest program `.pi/frameworks/hivemind/`. Config is project-root `hivemind.yaml` (write-if-missing from the profile template). Not a Pi extension and not coord. Core knows typed folders, front matter, lanes, runs, and faults. It does not know ticket, slice, intent, sealed, or ready-for-agent. Those names live only in a profile `hivemind.yaml`.
- **Session extensions**: `packages/heio-boot`, `heio-footer`, `heio-onic`. In-session Pi plugins. Not hivemind. Parked coord lives under `deprecated/packages/heio-coord`.
- **Profile**: the product cut. A dest receives only what the profile lists. `profiles/agentic-core` develops this pack; it is not an export. `profiles/heio-stack` is the stack export. Domain extras (gamedev, life-engine) stay off any profile that did not name them.

## Tracker

This checkout runs **heio-stack**. Live work lives under `.heio/planning/` (intent, locations, sprints, slices), `.heio/tickets/`, and `.heio/archive/`. Git ignores `.heio/`. `docs/` stays the committed source of truth.

Session checklists stay on the `todo` tool (`@inobit/pi-todo`, session branch). Do not write `.heio/TODO.md` or `.heio/sessions/*/TODO.md`. Do not treat those files, `.heio/inbox/`, or `.heio/planning/plans/` as the tracker.

Chart intent, locations, and sprints with **heio-wayfinder**. Plan a slice or ticket with **heio-planning**. Execute a frozen slice with **heio-slice**. Every output ends `VERDICT: TASK | TICKET | ESCALATE | VERIFY`.

The role skill is the pipeline; plain `pi` is not trapped.

## Verify

Repo checks live under `tests/checks/`. Repo tests live under `tests/<area>/`. `scripts/test.mjs` and `scripts/typecheck.mjs` are the only npm entrypoints.

```
pnpm test
pnpm run typecheck
```

## Pi

The local profile is `profiles/agentic-core/profile.yaml`. It is the skill list for developing this pack, not an export profile. It also installs the heio-stack skills so this checkout can run the loop.

Run `pi` in this directory. Trust the folder.
