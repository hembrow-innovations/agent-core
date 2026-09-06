# agent-core

AI installer. Holds markdown libraries, stacks, and project profiles, then copies a dest `.opencode/` tree. Pi is deprecated.

## Develop this repo

```
pnpm exec agentic-core install . --profile agentic-core
```

Restart OpenCode so it loads the dest files.

Edit `ai/`, `stacks/`, and `profiles/`. `.opencode/` is a generated dest.
