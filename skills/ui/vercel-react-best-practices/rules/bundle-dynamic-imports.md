---
title: Vite Dynamic Imports for Heavy Components
impact: CRITICAL
impactDescription: directly affects TTI and LCP
tags: bundle, dynamic-import, code-splitting, lazy
---

## Vite Dynamic Imports for Heavy Components

Use React `lazy()` with Vite dynamic `import()` to lazy-load large components not needed on initial render.

**Incorrect (heavy component bundles with main chunk):**

```tsx
import { MonacoEditor } from "./monaco-editor"

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

**Correct (loads on demand):**

```tsx
import { lazy } from "react"

const MonacoEditor = lazy(() =>
  import("./monaco-editor").then((m) => ({ default: m.MonacoEditor })),
)

function CodePanel({ code }: { code: string }) {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <MonacoEditor value={code} />
    </Suspense>
  )
}
```

**Life-engine pattern (cross-package lazy loading):**

```tsx
import { lazy, type ComponentType } from "react"

const CreateEventModal = lazy(() =>
  import("@life-engine/calendar-web/components").then((m) => ({
    default: m.CreateEventModal as ComponentType<CreateModalProps>,
  })),
)
```

Always wrap lazy-loaded components in `<Suspense>` with a fallback for the loading state.