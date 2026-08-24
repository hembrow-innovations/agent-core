---
title: renderHook with a thin QueryClient
impact: HIGH
impactDescription: default retries make hook tests slow and flake
tags: [render, hooks, tanstack]
---

## renderHook with a thin QueryClient

Hook tests use Testing Library `renderHook` plus a local wrapper. Turn retries off. Do not wrap the whole app.

**Incorrect:**
```ts
renderHook(() => useVehicles());
```

**Correct:**
```ts
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
}

const { wrapper } = createWrapper();
const { result } = renderHook(() => useVehicles(), { wrapper });
await waitFor(() => expect(result.current.isSuccess).toBe(true));
```

Notes: New domains mock `useSupabase` / `useRealtimeQuery` (no MSW). Established MSW domains point the fake client at `http://localhost`. See `mock-msw-or-client`.
