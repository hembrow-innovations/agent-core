---
title: Make aliases absolute
impact: CRITICAL
impactDescription: alias resolves relative to the importer
tags: [pitfall, alias]
---

## Make aliases absolute

A string like `'@/': './src/'` is relative to the importing file, not the project root.

**Incorrect:**
```ts
alias: { "@/": "./src/" }
```

**Correct:**
```ts
alias: { "@/": new URL("./src/", import.meta.url).pathname }
```

Notes: `resolve.alias` in Vite has the same trap. Fix it once in config.
