---
title: Pass a provider factory, not a string
impact: HIGH
impactDescription: Vitest 4 provider API
tags: [browser, v4]
---

## Pass a provider factory, not a string

`provider: "playwright"` is gone. Import `playwright` from `@vitest/browser-playwright`. `@vitest/browser` is no longer needed.

**Incorrect:** `browser: { provider: "playwright", instances: [{ browser: "chromium" }] }`

**Correct:**
```ts
import { playwright } from "@vitest/browser-playwright";
browser: {
  provider: playwright({ launchOptions: { headless: true } }),
  instances: [{ browser: "chromium" }],
}
```

Notes: `preview` is not the default. Name launch options the way Playwright does.
