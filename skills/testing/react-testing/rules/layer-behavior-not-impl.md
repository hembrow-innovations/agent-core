---
title: Test behavior, not implementation
impact: CRITICAL
impactDescription: impl-coupled tests break on every refactor
tags: [layer, tdd, queries]
---

## Test behavior, not implementation

A test that survives an internal rewrite is the only test worth keeping. Assert what the user or caller can observe. See the **tdd** skill.

**Incorrect:**
```ts
expect(useRealtimeQuery).toHaveBeenCalled();
expect(wrapper.state().open).toBe(true);
```

**Correct:**
```ts
expect(screen.getByRole("button", { name: /save/i })).toBeEnabled();
await user.click(screen.getByRole("button", { name: /save/i }));
expect(await screen.findByText(/saved/i)).toBeInTheDocument();
```

Notes: Hook-layer tests may assert query options. Feature UI must not. If the only way to assert is a mock call count, you are at the wrong seam.
