# commands

OpenCode slash commands installed to `.opencode/command/`.

Each command loads a pstack skill (or poteto-mode playbook) and passes `$ARGUMENTS`.

Entry points: `/poteto-mode`, `/setup-pstack`, `/orchestrate`.

Project-specific commands (e.g. `/verify-<app>`) stay in the target repo; generate them with `/create-verification-skill` after install.
