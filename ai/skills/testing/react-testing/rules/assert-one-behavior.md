---
title: One behavior per test
impact: MEDIUM
impactDescription: kitchen-sink tests hide which assertion failed
tags: [assert]
---

## One behavior per test

One reason to fail. Setup can be shared. Assertions that are the same story (role + disabled) may sit together. Do not click five tabs in one `it`.

**Incorrect:**
```ts
it("tasks page", () => {
  render(<TasksPage />);
  expect(screen.getByText("Buy groceries")).toBeTruthy();
  fireEvent.press(screen.getByText("Done"));
  fireEvent.press(screen.getByText("Lists"));
  expect(screen.getByText("Groceries")).toBeTruthy();
});
```

**Correct:** Split into "renders the seed tasks", "complete marks the row done", "lists chip shows list titles".

Notes: `test.each` over variants is one behavior (the variant matrix), not a kitchen sink.
