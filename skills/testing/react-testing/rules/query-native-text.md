---
title: Native queries use text and toBeTruthy
impact: HIGH
impactDescription: jest-dom matchers do not exist in RNTL
tags: [query, native]
---

## Native queries use text and toBeTruthy

`@testing-library/react-native` has no DOM and no `@testing-library/jest-dom`. `toBeInTheDocument` will fail or lie. Query by text, label, or testID. Assert with `toBeTruthy` / `toBeNull` / `toHaveTextContent`.

**Incorrect:**
```ts
import { render, screen } from "@testing-library/react";
expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
```

**Correct:**
```ts
import { render, screen } from "@testing-library/react-native";
expect(screen.getByText("Save")).toBeTruthy();
expect(screen.queryByText("Board")).toBeNull();
```

Notes: Some RN components expose roles; do not assume they do. NativeWind class names live on `props.className` — see `rn-nativewind-classname`.
