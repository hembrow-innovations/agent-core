# agent-core

This repo is the AI installer. It holds markdown libraries, stacks, and profiles, then copies a dest tree. Edit agents, skills, and prompts here. Pi is deprecated.

## Rules

- Markdown: never tables — use `- **{text}**: {text}`
- for scripting only use js/mjs
- TypeScript lives in `packages/`. Package tests stay next to their source as `*.test.ts`.
- One git repo. Products stay separate by folder, profile, and nouns. Do not mix them in code or instructions. Do not split remotes from a session; that is a map decision.
- Edit source under `ai/`, `stacks/`, `profiles/`, and `packages/`. `.opencode/` is a generated dest. Do not treat it as source of truth.
- `deprecated/` is parked. Not installed. Not in the workspace. Pi runtime, plugins, and system prompts live there.
- Commits as work packages: <type>(<scope>): <description> — feat | fix | test | refactor | chore
- No Co-Authored-By lines

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

Use `.` as the target to install into this checkout. Dest is always `.opencode/`. The CLI dies unless it can see `profiles/`, `ai/skills/`, and `stacks/` here. Playbooks stay in source; install does not copy them. Leftover profile keys such as `playbooks:`, `harness:`, `packages:`, `settings:`, `system-prompt:`, and `extensions:` are errors.

## Source

- `ai/` is the shared pack files.
  - `ai/agents/` is the agent library.
  - `ai/skills/` is the skill library.
  - `ai/playbooks/` is the playbook library.
  - `ai/prompts/` is the prompt/command library.
- `stacks/` is product units. Each stack is `stacks/<name>/` and comes with everything inside it: `agents/`, `skills/`, and `prompts/`. A profile names a stack and install copies that unit.
- `deprecated/` is parked code, skills, and Pi runtime markdown. Not installed. Not in the workspace.
- `profiles/` is the install profiles. Each profile is `profiles/<name>/profile.yaml`.
- `scripts/` is the npm entrypoints (`test`, `typecheck`). Do not put checks or tests here.
- `tests/` is the repo checks and tests. Profile parse lives in `packages/installer`. Package tests stay next to their source under `packages/`.
- `packages/installer/` is the `agentic-core` CLI.

## Splits

- **Pack**: skill, agent, playbook, and prompt libraries plus the installer. Source `ai/` and `profiles/`. Dest copy is `.opencode/`.
- **Stack**: a folder under `stacks/` that ships as one unit. `stacks/heio-stack` is the tracker: its skills, `heio-*` agents, and prompts. A dest only gets a stack if the profile names it. The `management` skill is a different `.heio/` convention; it is not this checkout's tracker. `@agentic-core/heio-coord` is parked; do not install or call `heio_stack`.
- **Session extensions**: parked Pi plugins under `deprecated/packages/`. Not installed. Pi is deprecated in this repo.
- **Profile**: the product cut. A dest receives named stacks plus listed pack skills, agents, and prompts. `profiles/agentic-core` develops this pack; it is not an export. `profiles/heio-stack` is the stack export. Domain extras (gamedev, life-engine, writing) stay off any profile that did not name them. `profiles/hivemind` installs this pack into the Hivemind dest. Hivemind itself is a separate repo.
- **World**: the novel dest. Skills under `ai/skills/writing/`. Profile `profiles/world`. Install into the world vault. Not this checkout.
