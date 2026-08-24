---
title: Mutating struct property copies
impact: CRITICAL
impactDescription: no movement bugs
tags: [pitfall, csharp]
---

## Mutating struct property copies

`Position.X = ...` does not update the node. Always reassign.

See also `csharp-struct-property-copy`.

**Correct:** `Position = Position with { X = value };`

