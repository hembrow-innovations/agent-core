---
title: React-api Owns Shared Behaviour
impact: HIGH
impactDescription: Twin hooks become two products
tags: [product, react-api]
---

## React-api Owns Shared Behaviour

**Incorrect:** `useSupabase().from(...)` in a screen, or a native twin of a web hook.
**Correct:** Platform-free behaviour and domain PostgREST live in `@life-engine/react-api`.

One product, three skins. Platform-free product behaviour and all domain PostgREST live in `@life-engine/react-api`. Feature packages are presentation.

**Why:** A hook in `features/*/web` and a twin in `features/*/native` is two products. A `useSupabase().from(...)` in a screen is a third data layer.

**Pattern:**
- Features and core UI import data only from `@life-engine/react-api/{feature}/{subdomain}`.
- react-api owns query keys, Zod shapes, PostgREST, invalidation, realtime, and pure domain math.
- There is no `features/*/shared` leaf and no third TypeScript data package.
- Desktop is the web SPA in Electron. Do not fork desktop behaviour.
- Inject toast, file export, and other platform capabilities through adapters. Data hooks do not import UI toast libraries.

**Vault:** data-flows, ADR-0035, ADR-0024, ADR-0026.

**The test:** could mobile call the same hook without copying logic? If no, the behaviour is in the wrong package.
