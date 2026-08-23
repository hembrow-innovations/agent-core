---
title: Use vitest.config when test settings would pollute Vite
impact: HIGH
impactDescription: dev server picks up test-only aliases
tags: [config]
---

## Use vitest.config when test settings would pollute Vite

Vitest reads `vite.config.*` by default. Test-only aliases, `server.deps.inline`, and `ssr.resolve.conditions` belong in a dedicated file when they would change the app build.

**Incorrect:** Stuffing `test.alias` and `server.deps.inline` into the app `vite.config.ts` that also builds production.

**Correct:** `vitest.config.ts` that `import`s shared Vite plugins, or a `vite.config.ts` that stays clean because tests need nothing extra.

Notes: If the existing file already holds `test: {}`, keep it. Do not split for style.
