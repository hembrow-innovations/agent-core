---
name: vercel-react-best-practices
description: React performance guidelines from Vercel Engineering. Use when writing, reviewing, or refactoring React components for performance, data fetching, or bundle size. Triggers on waterfalls, barrel imports, React.cache, Suspense, lazy import, re-renders.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel React best practices

Upstream guide from Vercel. 45 rules across 8 categories. Full expanded text lives in [AGENTS.md](AGENTS.md). Per-rule detail lives in `rules/<prefix>-*.md`.

## Discover first

1. Read the app framework from `package.json` and neighboring routes. Next.js App Router, TanStack Start, Vite SPA, and Expo web need different server and bundle rules.
2. Find the data layer. TanStack Query, SWR, RSC `fetch`, or a project API package. Copy what neighboring hooks use.
3. Find the UI kit and whether the tree uses `'use client'` or RSC. Do not invent a server or client split the repo does not have.

If `AGENTS.md` or `WORKSPACE.md` already names a tracker (`.scratch/`, `docs/planning/`, GitHub Issues), that file wins. Working notes go through **management**. Durable decisions go through **docs**.

### Prefer

- **async-*** waterfalls, `Promise.all`, defer await
- **bundle-*** avoid heavy barrels, dynamic `import()`, defer third-party. Use the bundler the repo already has. `next/dynamic` only on Next. Vite `import()` otherwise.
- **rerender-*** / **rendering-*** / **js-*** / **advanced-*** general React

### Apply carefully

- **server-cache-react** `React.cache()` only when the same request tree benefits
- **server-cache-lru** process-local LRU only when justified. Do not assume multi-request instance sharing.
- **server-serialization** minimize loader, server-fn, or RSC return payloads
- **rendering-activity** React `<Activity>` is experimental. Verify availability before adopting.

### Do not introduce

- Next.js APIs (`next/dynamic`, `next/server`, `next/headers`, App Router layouts, `after()`) unless the repo is Next
- SWR or `useSWR` as a data layer unless the repo already uses SWR
- A second fetch cache next to the project's Query or RSC cache

## When to apply

- Writing or reviewing React components or routes
- Data fetching or cache behavior
- Bundle size or load-time work
- Re-render or list-rendering pain

## Rule categories by priority

- **1 CRITICAL** - Eliminating Waterfalls (`async-`)
- **2 CRITICAL** - Bundle Size (`bundle-`)
- **3 HIGH** - Server-Side (`server-`)
- **4 MEDIUM-HIGH** - Client Data Fetching (`client-`)
- **5 MEDIUM** - Re-render (`rerender-`)
- **6 MEDIUM** - Rendering (`rendering-`)
- **7 LOW-MEDIUM** - JavaScript (`js-`)
- **8 LOW** - Advanced (`advanced-`)

## Quick reference

### 1. Eliminating Waterfalls (CRITICAL)

- `async-defer-await` - Move await into branches where actually used
- `async-parallel` - Use Promise.all() for independent operations
- `async-dependencies` - Use better-all for partial dependencies
- `async-api-routes` - Start promises early, await late (loaders / server fns)
- `async-suspense-boundaries` - Use Suspense to stream content where applicable

### 2. Bundle Size Optimization (CRITICAL)

- `bundle-barrel-imports` - Import directly, avoid heavy barrels
- `bundle-dynamic-imports` - `lazy(() => import(...))` for heavy components
- `bundle-defer-third-party` - Load analytics/logging after hydration
- `bundle-conditional` - Load modules only when feature is activated
- `bundle-preload` - Preload on hover/focus for perceived speed

### 3. Server-Side Performance (HIGH)

- `server-cache-react` - React.cache() for per-request deduplication
- `server-cache-lru` - process-local LRU only when justified
- `server-serialization` - Minimize loader / server-fn / RSC return payloads
- `server-parallel-fetching` - Parallel fetch in the project's loaders
- `server-after-nonblocking` - Fire-and-forget after the response, with the API the stack has

### 4. Client-Side Data Fetching (MEDIUM-HIGH)

- `client-swr-dedup` - Deduplicate via the project's data layer (Query keys, SWR, or RSC fetch)
- `client-event-listeners` - Deduplicate global event listeners
- `client-passive-event-listeners` - Passive listeners for scrolling
- `client-localstorage-schema` - Version and minimize localStorage data

### 5 to 8

Re-render, rendering, JS, and advanced rules are stack-agnostic. Use freely. See the list in [AGENTS.md](AGENTS.md) or `rules/`.

## How to use

```
rules/async-parallel.md
rules/bundle-barrel-imports.md
```

Read only the rules that match the current task. Do not bulk-read `rules/` or load all of `AGENTS.md` unless stuck.

Each rule: why → incorrect → correct → notes.
