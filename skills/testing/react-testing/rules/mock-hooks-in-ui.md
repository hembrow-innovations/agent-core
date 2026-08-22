---
title: Feature UI mocks data hooks
impact: HIGH
impactDescription: UI tests that hit the network are slow and coupled
tags: [mock, web, native]
---

## Feature UI mocks data hooks

Page and form tests do not talk to the backend. They stub hook return values: loading, empty, data, error. Mutations are `mutate` spies.

**Incorrect:** Mount `<TasksPage />` with a live QueryClient and hope MSW is running.

**Correct:**
```ts
function setup(over = {}) {
  mockUseTasks.mockReturnValue({
    data: over.tasks ?? seedTasks,
    isLoading: over.tasksLoading ?? false,
    isError: over.tasksError ?? false,
    refetch: vi.fn(),
  });
}
```

Notes: Persistence is proven in the data-layer suite or in E2E, not in the page test. See `rn-false-green`.
