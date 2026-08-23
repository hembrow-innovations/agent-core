---
title: Import from vitest unless the repo enabled globals
impact: HIGH
impactDescription: test is not defined
tags: [setup]
---

## Import from vitest unless the repo enabled globals

Globals are off by default. Testing Library also skips auto cleanup when globals are off and you forgot to import.

**Incorrect:** `test("adds", () => { expect(1).toBe(1); });` with no import and no `globals: true`.

**Correct:** `import { expect, test } from "vitest";` or, if the repo already set `globals: true`, match that and keep the tsconfig types.

Notes: Do not flip `globals` in a package that already imports. Match neighbors.
