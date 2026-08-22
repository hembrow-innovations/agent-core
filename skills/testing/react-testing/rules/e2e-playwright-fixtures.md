---
title: Use the project's Playwright fixtures
impact: HIGH
impactDescription: raw @playwright/test skips auth and project fixtures
tags: [e2e, playwright]
---

## Use the project's Playwright fixtures

If the repo wraps Playwright (auth, Electron swap, base URL), import `test` and `expect` from that wrapper — not from `@playwright/test`.

**Incorrect:**
```ts
import { expect, test } from "@playwright/test";
```
in a repo whose specs import `../fixtures`.

**Correct:** Copy a neighboring spec's import. Use page objects if the suite has them. Role queries. Wait on `locator.waitFor({ state: "visible" })` or URL.

Notes: Interactive agent-driven browsing is the **playwright-cli** skill, not the committed suite. If there is no wrapper, raw `@playwright/test` is fine.
