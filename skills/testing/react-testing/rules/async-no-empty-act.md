---
title: Do not use empty act
impact: HIGH
impactDescription: empty act hides the real async seam
tags: [async, pitfall]
---

## Do not use empty act

`await act(async () => {})` flushes microtasks without saying what you waited for. It is a flake waiting to happen.

**Incorrect:**
```ts
render(<RootLayout />);
await act(async () => {});
expect(screen.getByText("stack")).toBeTruthy();
```

**Correct:**
```ts
render(<RootLayout />);
expect(await screen.findByText("stack")).toBeTruthy();
```

Notes: `apps/mobile` root-layout test is the known scar. Do not copy it. If session is async, mock it resolved or `findBy` the post-session UI.
