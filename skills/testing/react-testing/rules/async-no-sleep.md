---
title: Do not sleep
impact: HIGH
impactDescription: sleeps are slow flakes
tags: [async, flake, e2e]
---

## Do not sleep

`setTimeout`, `waitForTimeout`, and Maestro `waitForAnimationToEnd` with a long ms are not assertions.

**Incorrect:**
```ts
await new Promise((r) => setTimeout(r, 500));
await page.waitForTimeout(3000);
```

**Correct:** `findBy`, `locator.waitFor({ state: "visible" })`, Maestro `extendedWaitUntil` on visible text. Wait for the thing you care about.

Notes: Maestro `inputText` DEADLINE is a debug-build problem, not a sleep problem — use a release APK (`e2e-maestro-release`).
