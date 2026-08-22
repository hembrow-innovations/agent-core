---
title: Put expect inside waitFor
impact: HIGH
impactDescription: waitFor without expect is a sleep
tags: [async, flake]
---

## Put expect inside waitFor

`waitFor` retries until the callback stops throwing. A body with no assertion returns immediately and races.

**Incorrect:**
```ts
await waitFor(() => {
  screen.getByText(/saved/i);
});
expect(true).toBe(true);
```

**Correct:**
```ts
await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});
expect(await screen.findByText(/saved/i)).toBeInTheDocument();
```

Notes: Prefer `findBy` for elements. Use `waitFor` for hook flags and non-element conditions. Never `waitFor` a `queryBy` that can be null on the first tick without an `expect`.
