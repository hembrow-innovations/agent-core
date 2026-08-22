---
title: userEvent on web, fireEvent.press on native
impact: HIGH
impactDescription: wrong interaction API skips real events
tags: [render, web, native]
---

## userEvent on web, fireEvent.press on native

Web UI kits should go through `@testing-library/user-event` so focus, pointer, and keyboard match the browser. Native uses `fireEvent.press` / `fireEvent.changeText`.

**Incorrect:**
```ts
// web
fireEvent.click(screen.getByRole("button", { name: /save/i }));
// native
import userEvent from "@testing-library/user-event";
await userEvent.click(screen.getByText("Save"));
```

**Correct:**
```ts
// web
const user = userEvent.setup();
await user.click(screen.getByRole("button", { name: /save/i }));

// native
fireEvent.press(screen.getByText("Save"));
fireEvent.changeText(screen.getByPlaceholderText("Title"), "Buy milk");
```

Notes: Existing web feature tests still use `fireEvent` in places. Prefer `userEvent` for new work. Do not mix both in one interaction.
