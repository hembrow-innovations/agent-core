---
title: Cleanup before UV/export
impact: HIGH
impactDescription: manifold health
tags: [topo, cleanup]
---

## Cleanup before UV/export

Checklist:

- [ ] Merge by distance (~0.0001 m)
- [ ] Remove loose verts/edges
- [ ] Delete interior faces
- [ ] Recalculate outside normals
- [ ] Apply scale if modifiers need it
- [ ] Manifold where collision/volume requires
- [ ] Polycount vs band

**Incorrect:** Export with inverted faces and duplicate verts.
