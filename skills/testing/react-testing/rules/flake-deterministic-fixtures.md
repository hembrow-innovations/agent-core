---
title: Fixtures must be deterministic
impact: HIGH
impactDescription: Date.now and random UUIDs flake across midnight and order
tags: [flake, fixtures]
---

## Fixtures must be deterministic

Seed data uses fixed UUIDs, fixed dates, and builders. `Date.now()`, `crypto.randomUUID()`, and locale greetings belong behind a clock you control.

**Incorrect:**
```ts
export const seedTask = { id: crypto.randomUUID(), dueAt: new Date().toISOString() };
expect(screen.getByText(/good afternoon/i)).toBeTruthy();
```

**Correct:**
```ts
export const TASK_ID = "10000000-0000-4000-a000-000000000001";
export const seedTask = { id: TASK_ID, title: "Buy groceries", dueAt: "2026-03-15T14:30:00.000Z" };
```

Notes: Time-of-day copy is a known Maestro flake. Assert a stable landmark (Overview, Welcome back) instead. Fake timers only when the unit under test reads the clock — see `async-fake-timers-sparingly`.
