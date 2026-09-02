---
title: Phased modeling workflow
impact: HIGH
impactDescription: predictable quality
tags: [model, workflow]
---

## Phased modeling workflow

```
0 design+refs → 1 scene setup → 2 blockout → 3 primary/secondary shape
→ 4 bevel/topo lock → 5 UV → 6 materials → 7 cleanup → 8 export → 9 Godot QA
```

**Incorrect:** Texture paint before silhouette approval; apply all modifiers mid-explore.

**Correct:** Gate each phase; keep blockout until silhouette approved.
