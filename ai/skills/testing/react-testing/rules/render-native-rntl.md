---
title: Render native with RNTL
impact: HIGH
impactDescription: RTL DOM APIs crash or no-op under RN
tags: [render, native]
---

## Render native with RNTL

Native screens and primitives use `@testing-library/react-native`. Jest globals. No `user-event`. No `toBeInTheDocument`.

**Incorrect:**
```ts
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
await userEvent.click(screen.getByRole("button", { name: /save/i }));
```

**Correct:**
```ts
import { fireEvent, render, screen } from "@testing-library/react-native";

render(<TasksPage />);
fireEvent.press(screen.getByText("Buy groceries"));
expect(mockComplete).toHaveBeenCalled();
```

Notes: Package `jest/setup.ts` must already stub AsyncStorage, Expo Router, keyboard-controller, DateTimePicker. See `mock-native-modules`.
