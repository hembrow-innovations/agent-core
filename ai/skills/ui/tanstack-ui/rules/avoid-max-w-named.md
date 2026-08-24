---
title: Avoid named max-width scales
impact: LOW
impactDescription: Prefer fractions over named max-w scales
tags: [avoid, layout, tailwind]
---

## Avoid named max-width scales

Honor the max-width utilities the project already uses. Many token themes omit named `max-w-{size}` scales (`max-w-sm`, `max-w-xl`). Prefer fractions when a max width is required and the neighboring layout does that.

**Incorrect:**

```tsx
<div className="max-w-xl mx-auto">...</div>
```

**Correct:**

```tsx
<div className="max-w-3/4 mx-auto">...</div>
```

**Notes.** If the layout needs no max width, omit it. Do not invent a one-off pixel cap. Copy the constraint a sibling screen already uses.
