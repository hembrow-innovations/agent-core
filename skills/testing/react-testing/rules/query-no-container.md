---
title: Do not query the DOM container
impact: HIGH
impactDescription: CSS selectors couple tests to markup
tags: [query, web]
---

## Do not query the DOM container

`container.querySelector` and class-string hunts break when CVA or Radix markup shifts. Use Testing Library queries.

**Incorrect:**
```ts
const { container } = render(<Button>Save</Button>);
expect(container.querySelector(".bg-primary-solid")).toBeTruthy();
```

**Correct:**
```ts
render(<Button>Save</Button>);
expect(screen.getByRole("button", { name: /save/i })).toHaveAttribute(
  "data-variant",
  "solid",
);
```

Notes: Token class assertions belong on primitives that own the CVA file, and even then prefer `data-variant` / role. Feature tests should not scrape class lists.
