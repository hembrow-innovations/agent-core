---
title: Import defineConfig from vitest/config
impact: CRITICAL
impactDescription: test keys silently ignored
tags: [config]
---

## Import defineConfig from vitest/config

`defineConfig` from `vite` does not type or always honor `test`. Agents copy the Vite import and then wonder why `environment` did nothing.

**Incorrect:**
```ts
import { defineConfig } from "vite";
export default defineConfig({ test: { environment: "happy-dom" } });
```

**Correct:**
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "happy-dom" },
});
```

Notes: A dedicated `vitest.config.ts` still uses `vitest/config`. Vite plugins stay in the same file.
