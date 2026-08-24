---
title: Cover loading, empty, and error
impact: HIGH
impactDescription: data UI that only tests the happy path ships skeletons as bugs
tags: [layer, assert, native, web]
---

## Cover loading, empty, and error

Any screen that fetches must prove the three states users actually see. Seeded data alone is not coverage.

**Incorrect:** One test that mocks `data: seedTasks` and asserts titles. No loading skeleton, no empty copy, no error retry.

**Correct:**
```ts
test("shows the skeleton while loading", () => {
  setup({ tasksLoading: true });
  render(<TasksPage />);
  expect(screen.getByTestId("task-list-skeleton")).toBeTruthy();
});

test("shows empty copy when there are no tasks", () => {
  setup({ tasks: [] });
  render(<TasksPage />);
  expect(screen.getByText(/no tasks/i)).toBeTruthy();
});
```

Notes: Error state needs a visible retry or message, not just `isError: true` on the mock. Product rules (hidden views, filtered lists) belong here too.
