# agent-core

AI installer. Holds project profiles and copies a dest `.opencode/` tree. Edit agents, skills, and prompts here.

## Develop this repo

```
pnpm exec agentic-core install . --profile agentic-core
```

Restart OpenCode so it loads the dest files.

Edit `ai/skills/`, `ai/playbooks/`, and `profiles/`. `.opencode/` is a generated dest.
