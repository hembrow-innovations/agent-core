---
title: Do not swallow console to hide act warnings
impact: HIGH
impactDescription: silenced act warnings hide real races
tags: [pitfall, async, flake]
---

## Do not swallow console to hide act warnings

Global `console.error = vi.fn()` hides `act(...)` warnings, rejected queries, and React 19 owner-stack noise you needed.

**Incorrect:**
```ts
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
```

**Correct:** Filter a known, named warning if a dependency is noisy. Leave `act` and React errors visible. Fix the race with `findBy` / `waitFor` + expect.

Notes: Existing UI setup files already swallow logs — do not copy that into new packages.
