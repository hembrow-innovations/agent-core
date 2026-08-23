---
title: Import page from vitest/browser
impact: MEDIUM
impactDescription: deprecated @vitest/browser/context
tags: [browser, v4]
---

## Import page from vitest/browser

Context and utils moved. The old paths still run for a while and will be removed.

**Incorrect:** `import { page } from "@vitest/browser/context"`

**Correct:** `import { page } from "vitest/browser"`

Notes: `@vitest/browser/utils` becomes `import { utils } from "vitest/browser"`.
