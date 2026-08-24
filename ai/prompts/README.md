# prompts

OpenCode slash prompts installed to `.opencode/command/`.

A profile lists the stems it wants, the same way it lists skills:

```yaml
prompts:
  - wizard
```

Each prompt loads a skill (or a draconic-mode playbook) and passes `$ARGUMENTS`.

Entry points: `/draconic-mode`, `/setup-draconic`, `/orchestrate`.

Project-specific prompts (for example `/verify-<app>`) stay in the target repo. Generate them with `/create-verification-skill` after install. Split a large guide into a router plus `rules/` with `/create-progressive-skill`.
