---
title: Do not stub the whole UI kit
impact: HIGH
impactDescription: tests that mock Button only prove the mock
tags: [mock, web]
---

## Do not stub the whole UI kit

Feature tests that replace `Form` / `Button` with `<button>` pass even when the real kit is broken. New work uses the real primitives and queries by role.

**Incorrect:**
```ts
vi.mock("../ui", () => ({
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  Form: ({ children }) => <form>{children}</form>,
}));
```

**Correct:** Import the real kit. Mock data hooks and toasts. Query `getByRole("button", { name: /save/i })`.

Notes: Stub a primitive only when it is an unreachable native island (date pickers — see `mock-native-modules`).
