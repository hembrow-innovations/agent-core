# commands

OpenCode slash commands installed to `.opencode/command/`.

Each command loads a skill (or a draconic-mode playbook) and passes `$ARGUMENTS`.

Entry points: `/draconic-mode`, `/setup-draconic`, `/orchestrate`.

Project-specific commands (for example `/verify-<app>`) stay in the target repo. Generate them with `/create-verification-skill` after install.
