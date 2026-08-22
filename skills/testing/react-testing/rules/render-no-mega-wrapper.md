---
title: Do not invent a mega provider wrapper
impact: HIGH
impactDescription: AllTheProviders hides missing deps and slows every test
tags: [render, providers]
---

## Do not invent a mega provider wrapper

There is no shared `AllTheProviders`. Feature pages mock hooks and render the page. Hooks get a thin `QueryClientProvider` (and a fake Supabase client only if MSW is in play).

**Incorrect:**
```tsx
function AllTheProviders({ children }) {
  return (
    <RouterProvider>
      <SessionProvider>
        <QueryClientProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryClientProvider>
      </SessionProvider>
    </RouterProvider>
  );
}
```

**Correct:** Page test: mock `useTasks` / `useNavigate`, `render(<TasksPage />)`. Hook test: local `createWrapper()` with `retry: false`, `gcTime: 0`.

Notes: A helper that re-exports RTL is fine. A helper that boots the app shell is not.
