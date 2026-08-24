---
title: Leave the default pool on forks
impact: HIGH
impactDescription: threads plus fetch or native addons crash
tags: [isolate]
---

## Leave the default pool on forks

Default pool is `forks`. `threads` plus `fetch` can fail to terminate workers. Native addons often segfault in threads.

**Incorrect:** `pool: "threads"` copied from an old blog post.

**Correct:** Omit `pool`, or set `pool: "forks"`. Switch only with a measured reason.

Notes: `vmForks` / `vmThreads` are for stubborn module-cache cases, not a default.
