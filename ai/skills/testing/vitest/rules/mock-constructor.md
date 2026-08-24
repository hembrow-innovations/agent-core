---
title: Mock constructors with class or function
impact: HIGH
impactDescription: arrow impl is not a constructor
tags: [mock, v4]
---

## Mock constructors with class or function

Vitest 4 constructs mocks called with `new`. An arrow `mockImplementation` throws `<anonymous> is not a constructor`.

**Incorrect:** `vi.spyOn(cart, "Apples").mockImplementation(() => ({ getApples: () => 0 }))`

**Correct:**
```ts
vi.spyOn(cart, "Apples").mockImplementation(class MockApples {
  getApples() { return 0; }
});
```

Notes: A `function () { this.getApples = () => 0; }` also works.
