---
title: Standard collection layout
impact: HIGH
impactDescription: scene hygiene
tags: [model, org]
---

## Standard collection layout

Establish via MCP immediately:

```
COL_Project
├── COL_Reference
├── COL_Blockout
├── COL_Geo
├── COL_Collision
└── COL_Export
```

**Incorrect:** Everything in Scene Collection with default names.

**Correct:** Move work into the matching collection; instances under a clear parent.
