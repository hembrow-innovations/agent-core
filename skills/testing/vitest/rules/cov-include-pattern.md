---
title: Set coverage.include in Vitest 4
impact: HIGH
impactDescription: report only lists files that ran
tags: [coverage, v4]
---

## Set coverage.include in Vitest 4

`coverage.all` is gone. The default report includes only files loaded during the run. Uncovered source disappears unless you include it.

**Incorrect:** Upgrading to v4 and reading a 100% report that omitted `src/unused.ts`.

**Correct:**
```ts
coverage: {
  include: ["src/**/*.{ts,tsx}"],
  exclude: ["src/**/*.test.ts"],
}
```

Notes: Do not include configs or `node_modules`. Narrow `include` first, then `exclude`.
