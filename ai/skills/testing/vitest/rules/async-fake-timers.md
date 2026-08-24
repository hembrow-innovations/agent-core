---
title: Advance fake timers on purpose
impact: HIGH
impactDescription: real clocks make time tests flake
tags: [async, timers]
---

## Advance fake timers on purpose

Debounce and interval tests need a fake clock. Leaving fake timers on leaks into the next file.

**Incorrect:** `await new Promise((r) => setTimeout(r, 1000))` to wait out a debounce.

**Correct:**
```ts
vi.useFakeTimers();
start();
await vi.advanceTimersByTimeAsync(1000);
expect(fn).toHaveBeenCalled();
vi.useRealTimers();
```

Notes: Jest legacy timers do not exist. Prefer `advanceTimersByTimeAsync` when the timer callback is async.
