---
title: Blockout gate before detail
impact: HIGH
impactDescription: avoids wasted tris
tags: [model, process]
---

## Blockout gate before detail

**Incorrect:** Ear canals and cloth wrinkles before body proportions pass elevated greyscale.

**Correct:** Primitive blockout in `COL_Blockout` → screenshot elevated → approve silhouette → only then move to `COL_Geo` detail.
