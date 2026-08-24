---
title: Use existing test scripts
impact: HIGH
impactDescription: invented entrypoints skip package config
tags: [web, run]
---

## Use existing test scripts

Run whatever the package or workspace already defines. Do not invent a root `pnpm test` or a new monorepo dispatcher.

**Incorrect:**
```bash
pnpm test          # when no root script exists
pnpm vitest run    # from the workspace root, skipping package config
```

**Correct:**
```bash
# whatever package.json / justfile already lists
pnpm test
pnpm --filter <pkg> test
npm test --workspace <pkg>
```

Notes: If there is no script, add one on the package you are testing — not a new workspace-wide runner unless asked.
