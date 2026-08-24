---
title: Jest globals are not on by default
impact: HIGH
impactDescription: test is not defined after a port
tags: [migrate, jest]
---

## Jest globals are not on by default

Jest enables globals. Vitest does not. Testing Library cleanup also depends on this.

**Incorrect:** Leaving `describe` / `it` / `expect` unimported after a Jest port.

**Correct:** Import from `vitest`, or set `globals: true` and add `"vitest/globals"` to tsconfig `types` if the repo wants the Jest shape.

Notes: Types come from `vitest`, not `jest.Mock`. `import type { Mock } from "vitest"`.
