---
title: Use findBy for elements that appear
impact: CRITICAL
impactDescription: getBy on async UI flakes or needs empty act
tags: [query, async]
---

## Use findBy for elements that appear

`findBy*` is `waitFor` + `getBy`. Use it when the node is not there on the first paint. Do not pair `waitFor` with a sync `getBy` unless you need a custom assertion.

**Incorrect:**
```ts
await waitFor(() => {
  expect(screen.getByText(/saved/i)).toBeInTheDocument();
});
```

**Correct:**
```ts
expect(await screen.findByText(/saved/i)).toBeInTheDocument();
```

Notes: `getBy` throws immediately. `queryBy` returns null — use it to assert absence. `findBy` times out — that timeout is the assertion.
