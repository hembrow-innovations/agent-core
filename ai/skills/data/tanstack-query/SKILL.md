---
name: tanstack-query
description: TanStack React Query 5 patterns for data hooks. Key factories, query options, domain mutations, realtime invalidation, route prefetch. Use when creating or changing JS/TS data hooks, API integration, query keys, or cache management.
---

# TanStack Query

Patterns for client data hooks. Discover the data layer first. Read only the rule files that match the task.

## Discover first

1. Find the package that owns query keys, query options, and domain mutations. Search exports of `useQuery`, `queryOptions`, key factories, and names like `createDomainMutation` or `useRealtimeQuery`.
2. Copy that package's file layout, import paths, and helper names.
3. Feature UI packages consume those hooks. They do not own API, query, or mutation code unless the repo already does that.
4. Durable data-flow, layering, and intent notes live under `docs/`. Load **docs** and search. Do not keep a hardcoded `docs/reference/...` path as the only law.

A project-local **tanstack-query** skill owns paved paths when present. `principle-react-api-owns-shared-behaviour` owns package ownership when installed.

## Layering law (read first)

- Load **docs**. Search for data-flow and intent notes.
- Data hooks live in the discovered data-layer package. Feature UI only consumes them.

```ts
import { useVehicle } from "@project_name/react-api/vehicles/vehicle";
```

That import is an example.

### Prefer

- **layout-*** entity files under the data layer, not feature packages
- **keys-*** stable primitive key factories
- **query-*** / **mutation-*** `*.queries.ts` plus the project's domain mutation helper
- **prefetch-*** route-loader `prefetchQuery` (no `*.prefetch.ts`)
- **cache-*** mutation plus realtime invalidation

### Do not introduce

- API, query, or mutation code inside feature packages when a data layer exists
- Objects inside query keys
- Standalone `*.prefetch.ts` files
- Hand-rolled `useMutation` when the project's domain helper fits
- `onOptimisticUpdate` or `onRollback` when the helper uses `optimistic:`

## When to apply

- New or changed domain hooks in the data layer
- Query keys, options, or realtime wiring
- Mutations, optimistic updates, or invalidation
- Route loaders that warm the query cache

## Rule categories by priority

- **1 CRITICAL** Layout (`layout-`)
- **2 CRITICAL** Query keys (`keys-`)
- **3 HIGH** Queries + hooks (`query-`)
- **4 HIGH** Mutations (`mutation-`)
- **5 MEDIUM** Prefetch (`prefetch-`)
- **6 MEDIUM** Cache invalidation (`cache-`)

## Quick reference

### 1. Layout (CRITICAL)

- **layout-layering** Hooks only in the data layer. Features import, never own API
- **layout-entity-files** `{entity}.keys|api|queries|hooks` layout under domain folders

### 2. Query keys (CRITICAL)

- **keys-factories** Key factories with stable primitives. Nest list and detail helpers

### 3. Queries + hooks (HIGH)

- **query-options-hooks** `*.queries.ts` options plus `useRealtimeQuery` or plain `useQuery`

### 4. Mutations (HIGH)

- **mutation-create-domain** Domain helper, `invalidateKeys`, `optimistic`

### 5. Prefetch (MEDIUM)

- **prefetch-route-loaders** Prefetch in route loaders. Server query client defaults

### 6. Cache (MEDIUM)

- **cache-invalidation** Mutation keys, realtime, broad vs targeted invalidate

## How to use

```
rules/layout-layering.md
rules/keys-factories.md
rules/mutation-create-domain.md
```

Read only the rules that match the task. Each rule is why, then incorrect, then correct, then notes.

Working notes go through **management**. Durable knowledge goes through **docs**.
