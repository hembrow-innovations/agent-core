---
title: Locators live on page objects
impact: MEDIUM
impactDescription: inline selectors duplicate and drift
tags: [e2e, playwright]
---

## Locators live on page objects

Playwright specs call page objects. They do not scatter `page.getByRole` strings across files for the same screen.

**Incorrect:**
```ts
await page.getByRole("textbox", { name: /email/i }).fill(email);
await page.getByRole("button", { name: /sign in/i }).click();
```
copied into every auth spec.

**Correct:**
```ts
await signInPage.signIn(email, password);
await expect(page).toHaveURL(/dashboard/);
```

Notes: Maestro uses `runFlow` of `partials/sign-in.yaml` for the same reason. Keep selectors in one place.
