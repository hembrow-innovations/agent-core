---
title: Custom export conditions need ssr.resolve.conditions
impact: HIGH
impactDescription: wrong package entry in node env
tags: [pitfall, resolve]
---

## Custom export conditions need ssr.resolve.conditions

The default environment is `node`, which uses Vite's `ssr` resolver. `resolve.conditions` only affects client, jsdom, happy-dom, and browser mode.

**Incorrect:** Setting `resolve.conditions: ["custom"]` and expecting `#internal` to load the `custom` entry in a Node test.

**Correct:** `ssr.resolve.conditions: ["custom", "import", "default"]` for Node tests. Use `resolve.conditions` only for DOM or browser projects.

Notes: This applies to both `exports` and `#` subpath imports.
