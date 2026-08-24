---
title: Expected values come from an oracle
impact: HIGH
impactDescription: tautologies never fail
tags: [assert, tdd]
---

## Expected values come from an oracle

The assertion must disagree with a broken implementation. Do not recompute the expected value the way the code does.

**Incorrect:**
```ts
expect(formatDue(task.dueAt)).toBe(formatDue(task.dueAt));
expect(buttonVariants({ intent: "solid" })).toEqual(buttonVariants({ intent: "solid" }));
```

**Correct:**
```ts
expect(formatDue("2026-03-15T14:30:00.000Z")).toBe("15 Mar, 14:30");
expect(screen.getByText("Buy groceries")).toBeTruthy();
```

Notes: Seed titles and fixed ISO strings are oracles. Snapshots derived from the same render are not. See **tdd** tautology rule.
