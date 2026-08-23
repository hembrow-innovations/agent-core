---
title: Override environment with a file comment
impact: MEDIUM
impactDescription: one DOM file forces a whole project
tags: [env]
---

## Override environment with a file comment

A control comment is enough for one file. Do not grow a project for a single exception.

**Incorrect:** A new project whose `include` is one file, only to flip the env.

**Correct:**
```ts
// @vitest-environment happy-dom
import { expect, test } from "vitest";
```

Notes: The comment must be at the top of the file. Projects still win when many files share the env.
