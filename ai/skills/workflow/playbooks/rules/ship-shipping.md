---
title: Shipping
impact: HIGH
impactDescription: Green is not safe
tags: [ship]
---

## Shipping

The half after Babysit. Verify each PR independently. Land only the contiguous verified run from the root.

**Incorrect:** Arm merge-when-ready because CI is green. Enable GitHub auto-merge on a stack. Touch the stack while the queue drains.

**Correct:** You own what lands. Independent verdicts. Contiguous run from the bottom. Then hands off the queue.

1. One verifier per PR on the real surface. `PASS`, `PASS+NOTES`, or `FAIL`. CI green is not a verdict.
2. Walk up from the lowest unmerged PR. Stop at the first gap.
3. Re-check `git patch-id` after a restack. A new SHA voids the verdict unless the patch-id is unchanged.
4. Arm merge-when-ready through Graphite only if the repo uses it. Never GitHub auto-merge on a stack.
5. Watch the drain. Do not `gt sync`, restack, or `gt submit --stack` while it runs.
6. Stop at the ceiling.

Library: `ai/playbooks/shipping.md` (dest: `playbooks/shipping.md`).

Notes: Merge-ready only is `ship-babysit`. No Graphite in the repo means `gh`, and say so.
