---
title: Query by role and name first
impact: CRITICAL
impactDescription: testIDs and class names hide inaccessible UI
tags: [query, a11y, web]
---

## Query by role and name first

Accessible queries fail when the UI is inaccessible. Prefer `getByRole`, `getByLabelText`, `getByPlaceholderText`, then text, then test id.

**Incorrect:**
```ts
screen.getByTestId("save-btn");
container.querySelector(".btn-primary");
```

**Correct:**
```ts
screen.getByRole("button", { name: /save/i });
screen.getByLabelText(/due date/i);
```

Notes: Web uses jest-dom (`toBeInTheDocument`). Native often has no roles — then `getByText` / `getByLabelText` / `getByTestId` in that order. See `query-testid-last` and `query-native-text`.
