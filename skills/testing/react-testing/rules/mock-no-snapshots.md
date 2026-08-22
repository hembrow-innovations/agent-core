---
title: Do not add snapshot tests
impact: HIGH
impactDescription: snapshots rubber-stamp markup
tags: [mock, assert]
---

## Do not add snapshot tests

Do not start snapshot testing unless the repo already uses it as policy.

**Incorrect:**
```ts
expect(tree).toMatchSnapshot();
expect(screen.toJSON()).toMatchInlineSnapshot();
```

**Correct:** Assert a role, text, disabled state, or a named class token on a primitive.

Notes: Visual lock belongs in the repo's screenshot / Storybook path if it has one — not a new Jest snapshot habit.
