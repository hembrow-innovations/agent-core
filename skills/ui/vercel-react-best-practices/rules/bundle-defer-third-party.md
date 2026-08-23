---
title: Defer Non-Critical Third-Party Libraries
impact: MEDIUM
impactDescription: loads after hydration
tags: bundle, third-party, analytics, defer
---

## Defer Non-Critical Third-Party Libraries

Analytics, logging, and error tracking don't block user interaction. Load them after hydration using `useEffect` + dynamic `import()`.

**Incorrect (blocks initial bundle):**

```tsx
import { Analytics } from "@vercel/analytics/react"

function App({ children }: { children: ReactNode }) {
  return (
    <div>
      {children}
      <Analytics />
    </div>
  )
}
```

**Correct (loads after hydration):**

```tsx
import { lazy, Suspense } from "react"

const Analytics = lazy(() =>
  import("@vercel/analytics/react").then((m) => ({ default: m.Analytics })),
)

function App({ children }: { children: ReactNode }) {
  return (
    <div>
      {children}
      {typeof window !== "undefined" && (
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      )}
    </div>
  )
}
```

**Alternative (imperative, no component):**

```tsx
function App({ children }: { children: ReactNode }) {
  useEffect(() => {
    void import("@vercel/analytics/react").then((m) => m.inject())
  }, [])

  return <div>{children}</div>
}
```

The `typeof window !== "undefined"` check prevents bundling the third-party module for SSR.