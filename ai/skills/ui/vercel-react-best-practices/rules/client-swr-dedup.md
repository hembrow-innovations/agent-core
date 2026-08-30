---
title: TanStack Query for Automatic Deduplication
impact: MEDIUM-HIGH
impactDescription: automatic deduplication
tags: client, tanstack-query, deduplication, data-fetching
---

## TanStack Query for Automatic Deduplication

TanStack Query automatically deduplicates identical queries within the same render pass. Query keys act as the deduplication key — components sharing the same key share one request.

**Incorrect (no deduplication, each instance fetches):**

```tsx
function UserList() {
  const [users, setUsers] = useState([])
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
  }, [])
}
```

**Correct (multiple instances share one request):**

```tsx
import type { Database } from "@project_name/database"
import type { SupabaseClient } from "@supabase/supabase-js"
import { queryOptions, useQuery } from "@tanstack/react-query"

// Factory closes over Supabase client — TQ's queryFn `client` is QueryClient, not Supabase
export const enginesQueryOptions = (client: SupabaseClient<Database>) =>
  queryOptions({
    queryKey: engineKeys.all,
    queryFn: () => getEngines(client),
  })

function EngineList({ supabase }: { supabase: SupabaseClient<Database> }) {
  const { data: engines } = useQuery(enginesQueryOptions(supabase))
  // ...
}

// Elsewhere — same key = same request, automatically deduplicated
function EngineCount({ supabase }: { supabase: SupabaseClient<Database> }) {
  const { data: engines } = useQuery(enginesQueryOptions(supabase))
  return <span>{engines?.length ?? 0}</span>
}
```

**Life-engine pattern (domain mutation with invalidation):**

```tsx
import { createDomainMutation } from "@project_name/react-api/main/utils"

export const useCreateReminder = createDomainMutation({
  mutationFn: (client, reminder: NewReminder) => createReminder(client, reminder),
  invalidateKeys: () => [reminderKeys.all],
})

export const useDeleteReminder = createDomainMutation({
  mutationFn: (client, id: string) => deleteReminder(client, id),
  invalidateKeys: () => [reminderKeys.all],
})
```

**For immutable data (fetch once, never refetch):**

```tsx
export const configQueryOptions = (client: SupabaseClient<Database>) =>
  queryOptions({
    queryKey: ["config"],
    queryFn: () => fetchConfig(client),
    staleTime: Infinity,
  })
```

`staleTime: Infinity` means the query is always considered fresh and will never refetch automatically.
