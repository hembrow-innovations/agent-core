# agent-core

AI installer for Pi. Holds project profiles and copies a dest `.pi/` tree. Edit agents, skills, prompts, and first-party extensions here.

## Develop this repo with Pi

```
pnpm exec agentic-core install . --profile agentic-core
pi
```

Trust the folder.

Edit `ai/skills/`, `ai/playbooks/`, `ai/system-prompts/`, and `profiles/`. `.pi/` is a generated dest.
