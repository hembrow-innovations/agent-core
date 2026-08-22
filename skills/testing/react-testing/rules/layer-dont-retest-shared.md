---
title: Do not retest shared hooks on native
impact: CRITICAL
impactDescription: duplicate suites drift and miss the real seam
tags: [layer, native]
---

## Do not retest shared hooks on native

If web and native share a data package, prove hooks once in that package. Native leaves test presentation: loading, empty, seeded copy, press handlers. They mock the hooks.

**Incorrect:** A native screen suite that `renderHook(useTasks)` and re-asserts query keys already covered in the shared data package.

**Correct:**
```ts
jest.mock("../api/tasks", () => ({
  useTasks: () => mockUseTasks(),
  useCompleteTask: () => ({ mutate: mockComplete, isPending: false }),
}));

test("renders the seed tasks", () => {
  setup();
  render(<TasksPage />);
  expect(screen.getByText("Buy groceries")).toBeTruthy();
});
```

Notes: If the bug is in the hook, add a test in the shared package. Native green does not prove persistence — see `rn-false-green`.
