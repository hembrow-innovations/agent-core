---
title: Groups for queries, not hidden globals
impact: MEDIUM
impactDescription: debuggability
tags: [scenes]
---

## Groups for queries, not hidden globals

Groups are great for “all enemies” / “persistable.” They are a poor substitute for real dependencies.

**Incorrect:** 40 different group names used as a secret messaging system.

**Correct:** Few stable groups + signals/services for behavior; document group names.

Notes: `get_nodes_in_group` allocates—cache if hot.

