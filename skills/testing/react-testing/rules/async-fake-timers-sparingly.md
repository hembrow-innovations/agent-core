---
title: Fake timers only for clocks
impact: MEDIUM
impactDescription: global fake timers break user-event and waitFor
tags: [async, timers]
---

## Fake timers only for clocks

Use fake timers when the unit reads `Date` or `setTimeout` as its behavior (due-date labels, wizard delays, animated numbers). Do not enable them by default.

**Incorrect:** `vi.useFakeTimers()` in a global setup file.

**Correct:**
```ts
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-15T14:30:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
});
```

Notes: Native equivalent is `jest.useFakeTimers().setSystemTime(...)`. If you fake timers, you own `advanceTimersByTime` — `userEvent` and `findBy` will stall otherwise.
