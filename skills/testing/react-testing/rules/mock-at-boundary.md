---
title: Mock at the service boundary
impact: HIGH
impactDescription: deep mocks lock internals
tags: [mock, tdd]
---

## Mock at the service boundary

Mock the module the unit is allowed to depend on: data hooks in feature UI, the client in the data package, native modules in RNTL setup. Do not mock child components of the unit unless they are a heavy foreign kit.

**Incorrect:**
```ts
vi.mock("./useTaskFormReducer");
vi.mock("./taskListHelpers");
```

**Correct:**
```ts
vi.mock("../api/tasks", () => ({
  useTasks: () => mockUseTasks(),
  useCompleteTask: () => ({ mutate: mockComplete, isPending: false }),
}));
```

Notes: If you need six internal mocks to render, the component is doing too much or you are at the wrong layer.
