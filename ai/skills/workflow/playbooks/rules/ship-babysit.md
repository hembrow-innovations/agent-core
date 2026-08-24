---
title: Babysit
impact: HIGH
impactDescription: Undeclared drive mode stops the phase agent from finishing
tags: [ship]
---

## Babysit

Drive a PR or a stack to merge-ready. Conflicts, review threads, CI. Not land.

**Incorrect:** Interleave build and babysit. Fix upstack while the frontier is red. Arm merge-when-ready. Mutate stack topology.

**Correct:** Declare the mode in the first line. Work the lowest unmerged PR. Stop at the human's line.

1. Mode: `drive`, `background`, `threads-only`, or `check`. Undeclared defaults to `drive`.
2. The merge frontier only. Batch upstack threads. Do not fix them yet.
3. One babysitter per stack.
4. No `gt submit --stack`, no restack, no force-push from inside a babysit.
5. Order: conflicts, then review threads, then CI. A conflict is reported, not resolved.
6. Trust the watcher at `scripts/watch-pr/watch-pr`, not a green check list.
7. Classify CI before any retrigger. Bugbot is triaged against the code.
8. Owner approval is a wait. Landing is `ship-shipping`.

Library: `ai/playbooks/babysit.md` (dest: `playbooks/babysit.md`).

Notes: "Land it" or "ship it" is `ship-shipping`. Opening is `ship-opening-a-pr`.
