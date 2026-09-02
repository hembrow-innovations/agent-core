---
title: Collision shape by class
impact: MEDIUM
impactDescription: gameplay feel
tags: [coll, design]
---

## Collision shape by class

| Asset | Shape |
| ------- | ------- |
| Characters | Capsule — no body mesh collider |
| Threats | Capsule/sphere |
| Towers | Box/cylinder footprint |
| Home | Simplified box/convex |
| Cell props (rock, tree) | Box on footprint. Runtime also adds `Blocker` StaticBody layer 1. See `docs/reference/guides/add-yard-blocker.md` |
| Water | Not a mesh. Chunk ground owns tall boxes on terrain id 2 |
| Crops | Trigger/soft — not wall-like |
| Fences | Thin boxes |

**Incorrect:** Mesh collider farmer that snags on every pebble.
