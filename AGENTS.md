# agent-core

This repo is the AI installer. It holds project profiles and copies a dest tree. Edit agents, skills, and prompts here.

## Rules

- Markdown: never tables — use `- **{text}**: {text}`
- for scripting only use js/mjs
- TypeScript lives in `packages/`. Package tests stay next to their source as `*.test.ts`.
- One git repo. Products stay separate by folder, profile, and nouns. Do not mix them in code or instructions. Do not split remotes from a session; that is a map decision.
- Edit source under `ai/`, `profiles/`, and `packages/`. `.opencode/` is a generated dest. Do not treat it as source of truth.
- `deprecated/` is parked. Not installed. Not in the workspace.

## Commands

- **pnpm test**: package tests, then `tests/profile` and `tests/oracle`. Repo checks under `tests/checks/` run from the profile tests. Do not put checks or tests in `scripts/`.
- **pnpm typecheck**: typecheck every workspace package.
- There is no lint script.
- After installer or package edits, run `pnpm test` then `pnpm typecheck`.
- For a single package, run that package's `test` and `typecheck` scripts.

Install from this checkout only:

```
pnpm exec agentic-core install <target> --profile agentic-core
```

Use `.` as the target to install into this checkout. Dest is always `.opencode/`. The CLI dies unless it can see `profiles/` and `ai/skills/` here. Playbooks stay in source; install does not copy them. Leftover profile keys such as `playbooks:`, `harness:`, `packages:`, `settings:`, `system-prompt:`, and `extensions:` are errors.

## Source

- `ai/` is the pack files.
  - `ai/agents/` is the agent library.
  - `ai/skills/` is the skill library.
  - `ai/playbooks/` is the playbook library.
  - `ai/prompts/` is the prompt/command library.
  - `ai/system-prompts/` is parked Pi runtime markdown. Install does not copy it.
- `deprecated/` is parked code and skills. Not installed. Not in the workspace.
- `profiles/` is the install profiles. Each profile is `profiles/<name>/profile.yaml`.
- `scripts/` is the npm entrypoints (`test`, `typecheck`). Do not put checks or tests here.
- `tests/` is the repo checks and tests. Profile parse lives in `packages/installer`. Package tests stay next to their source under `packages/`.
- `packages/installer/` is the `agentic-core` CLI.

## Splits

- **Pack**: skill, agent, playbook, and prompt libraries plus the installer. Source `ai/` and `profiles/`. Dest copy is `.opencode/`.
- **Heio-stack**: the tracker. Skills under `ai/skills/heio-stack/` and `heio-*` agents. This checkout runs it. A dest only gets it if the profile lists it. The `management` skill is a different `.heio/` convention; it is not this checkout's tracker. `@agentic-core/heio-coord` is parked; do not install or call `heio_stack`.
- **Session extensions**: parked Pi plugins under `deprecated/packages/`. Not installed.
- **Profile**: the product cut. A dest receives only what the profile lists. `profiles/agentic-core` develops this pack; it is not an export. `profiles/heio-stack` is the stack export. Domain extras (gamedev, life-engine, writing) stay off any profile that did not name them. `profiles/hivemind` installs this pack into the Hivemind dest. Hivemind itself is a separate repo.
- **World**: the novel dest. Skills under `ai/skills/writing/`. Profile `profiles/world`. Install into the world vault. Not this checkout.
