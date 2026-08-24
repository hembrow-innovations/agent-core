---
title: UI only from platform packages
impact: HIGH
impactDescription: Stops rogue primitives and cross-surface imports
tags: [package, boundary, ui]
---

## UI only from platform packages

Presentation code imports building blocks only from the UI packages already used on that surface. Discover those names. Typical shapes are `ui-components-web`, `ui-infra-web`, `ui-components-native`, plus feature UI next to the screen.

**Incorrect:**

```tsx
// inside a feature web route
import { Button } from "@/components/Button"; // ad-hoc app-local primitive
import { Card } from "@acme/some-random-kit";
```

**Correct:**

```tsx
import { Button } from "@acme/ui-components-web";
// or the package's established public export path
```

**Notes.** Do not invent a parallel button or input stack in the app. Extend or compose from the kit the repo already has. A desktop shell of a web SPA does not get a third component library.
