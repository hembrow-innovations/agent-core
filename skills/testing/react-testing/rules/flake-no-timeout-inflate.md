---
title: Do not hide flakes with timeouts
impact: CRITICAL
impactDescription: longer waits make reds rarer, not greener
tags: [flake, e2e, playwright, maestro]
---

## Do not hide flakes with timeouts

If a test is flaky, fix the wait condition or the product. Do not raise `timeout`, `retries`, or `waitFor` limits to bury it.

**Incorrect:**
```ts
await page.getByRole("heading", { name: /overview/i }).waitFor({ timeout: 60_000 });
test.describe.configure({ retries: 5 });
```

**Correct:** Wait on a deterministic signal — URL, role visibility, `findBy`. If it still flakes, quarantine with an issue (see `flake-quarantine-with-issue`).

Notes: Follow the repo's flake policy if one exists. Maestro `inputText` hangs on debug builds — use a release build, do not add sleeps.
