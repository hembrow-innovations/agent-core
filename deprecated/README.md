# Deprecated

Parked until a final keep-or-delete call. Nothing here is in the pnpm workspace, `ai/skills/`, `stacks/`, or any profile. The installer cannot see it. Pi is deprecated in this repo.

## Packages

- **heio-boot**, **heio-footer**, **heio-onic**: in-session Pi plugins
- **heio-coms**: living-session mailbox
- **heio-teams**: tmux agent teams
- **heio-todo**: session checklist
- **heio-coord**: in-session heio-stack gate

## Skills

- **agent-teams**: living Pi TUI panes in tmux
- **how**, **why**, **unslop**: previously in `ai/deprecated/`

## System prompts

Parked Pi runtime markdown. Used to live under `ai/system-prompts/`. Install does not copy it.

## Tests

- `deprecated/tests/pi`: parked Pi dest and agent-system checks

## Scripts

Manual smoke for the parked packages. They are not repo entrypoints.

- `try-coms.mjs`
- `try-teams.mjs`
- `run-pi-coms-larder.mjs`

Do not add this folder to a profile. Do not list these packages as `local:@agentic-core/<name>`.
