---
title: Use projects, not workspace
impact: CRITICAL
impactDescription: Vitest 4 dropped workspace files
tags: [config, v4]
---

## Use projects, not workspace

`test.workspace` and `vitest.workspace.js` are gone. Mixed environments and isolation live in `test.projects`.

**Incorrect:**
```ts
test: { workspace: "./vitest.workspace.js" }
```

**Correct:**
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    projects: [
      { test: { name: "unit", environment: "node", include: ["src/**/*.test.ts"] } },
      { test: { name: "dom", environment: "happy-dom", include: ["src/**/*.test.tsx"] } },
    ],
  },
});
```

Notes: `environmentMatchGlobs` and `poolMatchGlobs` are also gone. Split those cases into projects. See `config-no-match-globs`.
