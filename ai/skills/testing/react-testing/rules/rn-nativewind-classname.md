---
title: Assert NativeWind tokens on className
impact: MEDIUM
impactDescription: computed styles are empty under Jest
tags: [rn, nativewind]
---

## Assert NativeWind tokens on className

Jest does not compute NativeWind styles. Assert the token string on `props.className`, the same way web primitives assert CVA output.

**Incorrect:**
```ts
expect(screen.getByText("New").props.style.backgroundColor).toBe("#00ff00");
```

**Correct:**
```ts
expect(screen.getByText("New").props.className).toContain("bg-primary-solid");
```

Notes: Feature screens should assert copy and presence, not tokens. Token assertions belong on UI primitives (`Badge.test.tsx`).
