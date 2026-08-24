---
title: Render web with Testing Library
impact: HIGH
impactDescription: wrong import pulls the native renderer
tags: [render, web]
---

## Render web with Testing Library

Web components render with `@testing-library/react`. Import the runner the package already uses (`vitest` or Jest globals).

**Incorrect:**
```ts
import { render, screen } from "@testing-library/react-native";
```

**Correct:**
```ts
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

render(<Button>Save</Button>);
expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
```

Notes: Setup files usually import `@testing-library/jest-dom` and call `cleanup()`. Do not boot the app framework (Next, TanStack Start, Remix) in a unit test.
