---
title: Match the project's router and framework
impact: HIGH
impactDescription: foreign framework test utils fail or lie
tags: [web, stack]
---

## Match the project's router and framework

Use the meta-framework and router the repo already has. Do not import Next, TanStack, Remix, or Expo test helpers unless those packages are dependencies.

**Incorrect:**
```ts
import { redirect } from "next/navigation";
vi.mock("next/router", () => ({ useRouter: () => ({ push: vi.fn() }) }));
```
in a repo that does not depend on `next`.

**Correct:** Open a neighboring test and mock the same router module. See `mock-router-web`.

Notes: Vercel React `server-*` rules apply only if this repo is Next / RSC. Discover first.
