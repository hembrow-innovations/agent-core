---
name: tanstack-ui
description: TanStack Start, React, Tailwind CSS v4, and CVA UI for TypeScript monorepos. Use when building or redesigning components, pages, or layouts; adding CVA variants or theme tokens; writing Start routes, loaders, or createServerFn; or reviewing waterfalls, bundle size, or re-renders.
---

# TanStack UI

Production UI for a TypeScript monorepo on TanStack Start, React, Tailwind CSS v4, and CVA. Replaces **frontend-design** and **vercel-react-best-practices** on this stack. Per-rule detail lives in `rules/<prefix>-*.md`.

## Discover first

1. Find the UI kit package and one neighboring primitive. Copy its folder shape, `cn()` path, and variant split.
2. Find theme tokens (`@theme` in CSS or a tokens package). Do not invent a second palette.
3. Find Start routes (`createFileRoute`) and the data layer (Query keys, `createServerFn`). Copy those imports.
4. Load **typography** for face load. Load **tanstack-query** for key factories and mutations. Load **typescript-best-practices** for types.

Working notes go through **management**. Durable token and design decisions go through **docs**.

## Stack

- **App.** TanStack Start + Router. Components SSR and hydrate interactive. Loaders are isomorphic.
- **Data.** `createServerFn` for server-only work. TanStack Query for the client cache.
- **Style.** Tailwind v4 `@theme` plus CVA. Not ad-hoc CSS modules or a second kit.
- **Types.** Serializable server-fn IO. `VariantProps` for CVA.

### Prefer

- **start-*** file routes, server fns, isomorphic loaders
- **async-*** waterfalls, `Promise.all`, defer await
- **token-**, **tw-**, **cva-** semantic colors and `.variants.ts`
- **bundle-*** direct imports, lazy routes, defer third-party
- **package-**, **mono-** kit layout and public exports

### Apply carefully

- **server-cache-react** when the same request tree calls a helper twice
- **server-cache-lru** process-local only. No multi-instance sharing.
- **rendering-activity** experimental. Verify before adopting.
- **principle-**, **quality-** raise the bar without extra chrome

### Do not introduce

- Next.js APIs (`next/dynamic`, `next/headers`, App Router, `after()`, `'use client'` as the default split)
- SWR unless the repo already uses it
- Hardcoded hex/rgb or palette utilities (`bg-blue-500`)
- Inline variant maps outside CVA
- A second UI kit, or a Tailwind v3 `theme.extend` next to v4 `@theme`
- Secrets or `process.env` at module scope in isomorphic files

## When to apply

- Building or redesigning a component, page, or layout
- Adding CVA variants, sizes, or visual states
- Writing or reviewing Start routes, loaders, or server functions
- Data fetching, cache, bundle size, or re-render pain

## Rule categories by priority

- **1 CRITICAL** Start execution (`start-`)
- **2 CRITICAL** Waterfalls (`async-`)
- **3 CRITICAL** Tokens + CVA (`token-`, `tw-`, `cva-`)
- **4 CRITICAL** Bundle (`bundle-`)
- **5 HIGH** Server + loaders (`server-`)
- **6 HIGH** Package / monorepo (`package-`, `mono-`)
- **7 MEDIUM-HIGH** Client data (`client-`)
- **8 MEDIUM** Design + quality (`principle-`, `quality-`, `ts-`)
- **9 MEDIUM** Re-render / rendering (`rerender-`, `rendering-`)
- **10 LOW** Avoid / JS / advanced (`avoid-`, `js-`, `advanced-`)

## Quick reference

### 1. Start (CRITICAL)

- `start-execution-model` - Code is isomorphic unless marked `.server.ts` / `createServerFn`
- `start-file-routes` - `createFileRoute` in the discovered routes tree
- `start-server-fn` - `createServerFn` + `.validator`; static import; protect the fn
- `start-loader-query` - Loaders run on server and client. Prewarm Query. Secrets stay in server fns
- `start-before-load` - Auth redirects in `beforeLoad`. Still auth the server fn
- `start-search-params` - `validateSearch` for typed search state
- `start-code-split` - Auto-split or `.lazy.tsx`. Do not split loaders
- `start-pending` - `pendingComponent` / `errorComponent` / `notFoundComponent`

### 2. Waterfalls (CRITICAL)

- `async-defer-await` - Await only on the branch that needs it
- `async-parallel` - `Promise.all` for independent work
- `async-dependencies` - `better-all` for partial dependencies
- `async-api-routes` - Start promises early in server fns and server routes
- `async-suspense-boundaries` - `pendingComponent`, `Await`, or `useSuspenseQuery`

### 3. Tokens + CVA (CRITICAL)

- `token-semantic-roles` - Semantic roles, never raw palette
- `token-foreground-pairs` - Surface + `-foreground` pair
- `tw-v4-theme` - Colors and fonts live in `@theme`
- `cva-variants-file` - `cva()` in `{Component}.variants.ts`
- `cva-cn-merge` - Merge with package-local `cn()`

### 4. Bundle (CRITICAL)

- `bundle-barrel-imports` - Import the leaf, not the barrel
- `bundle-dynamic-imports` - `lazy(() => import())` for heavy widgets
- `bundle-defer-third-party` - Analytics after hydration
- `bundle-conditional` - Load a module only when the feature is on
- `bundle-preload` - Preload on hover or focus

### 5. Server (HIGH)

- `server-parallel-fetching` - Parallel `ensureQueryData` in loaders
- `server-serialization` - Return only fields the UI renders
- `server-cache-react` - `React.cache()` per request
- `server-cache-lru` - Process-local LRU only when measured
- `server-after-nonblocking` - `void` side effects after the mutation

### 6. Package (HIGH)

- `package-component-layout` - Folder shape of an existing primitive
- `package-ui-sources` - Only the discovered UI packages own primitives
- `mono-public-exports` - Import a package's public export, not `src/`

### 7. Client data (MEDIUM-HIGH)

- `client-query-dedup` - Shared Query keys. No ad-hoc `fetch` in `useEffect`
- `client-event-listeners` - One global listener for N instances
- `client-passive-event-listeners` - `{ passive: true }` on scroll/touch
- `client-localstorage-schema` - Versioned, minimal, try/catch

### 8. Design + quality (MEDIUM)

- `principle-design-thinking` / `principle-product` - Job first, calm chrome
- `quality-typography-spacing` / `quality-states-a11y` / `quality-motion-theme` - Scale, AA, tokens
- `ts-variant-props` - `VariantProps<typeof variants>`

### 9. Re-render / rendering (MEDIUM)

- `rerender-derived-state` `rerender-memo` `rerender-dependencies` `rerender-defer-reads` `rerender-functional-setstate` `rerender-lazy-state-init` `rerender-transitions`
- `rendering-activity` `rendering-hoist-jsx` `rendering-conditional-render` `rendering-content-visibility` `rendering-hydration-no-flicker` `rendering-animate-svg-wrapper` `rendering-svg-precision`

### 10. Avoid / JS / advanced (LOW)

- `avoid-hardcoded-colors` `avoid-inline-variants` `avoid-max-w-named` `avoid-decorative-noise`
- `js-early-exit` `js-set-map-lookups` `js-index-maps` `js-combine-iterations` `js-cache-function-results` `js-cache-property-access` `js-cache-storage` `js-length-check-first` `js-min-max-loop` `js-hoist-regexp` `js-tosorted-immutable` `js-batch-dom-css`
- `advanced-event-handler-refs` `advanced-use-latest`

## How to use

```text
rules/start-server-fn.md
rules/token-semantic-roles.md
rules/async-parallel.md
```

Read only the rules that match the current task. Do not bulk-read `rules/`. Prefer higher-priority categories when reviewing.

Each rule: why → incorrect → correct → notes.
