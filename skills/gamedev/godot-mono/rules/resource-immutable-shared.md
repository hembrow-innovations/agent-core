---
title: Duplicate before mutating shared resources
impact: HIGH
impactDescription: cross-instance corruption
tags: [resources]
---

## Duplicate before mutating shared resources

`.tres` resources are shared by reference. Mutating a shared Resource affects all users.

**Incorrect:** `stats.max_hp += 5` on a shared resource instance used by every enemy type.

**Correct:** `stats = stats.duplicate()` (deep when needed) before per-instance mutation, or design resources immutable and store runtime state on the node.

Notes: This bites hybrid projects when C# and GDScript both touch the same Resource.

