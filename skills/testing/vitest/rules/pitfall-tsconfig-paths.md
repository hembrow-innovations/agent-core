---
title: Vite does not honor tsconfig paths by default
impact: CRITICAL
impactDescription: Cannot find module './relative-path'
tags: [pitfall, alias]
---

## Vite does not honor tsconfig paths by default

`baseUrl` and `paths` in `tsconfig.json` are TypeScript-only. Vitest will not resolve `src/helpers` unless you teach Vite.

**Incorrect:** Importing `src/helpers` because `tsconfig` has `"baseUrl": "."`, then watching the suite die.

**Correct:** Install `vite-tsconfig-paths` and add it to `plugins`, or rewrite the import to a real relative path, or set `test.alias` to an absolute URL.

Notes: Prefer relative imports for one-off files. Use the plugin when the whole app already ships path aliases.
