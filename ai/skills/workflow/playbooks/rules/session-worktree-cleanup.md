---
title: Worktree and simulator cleanup
impact: LOW
impactDescription: Deleting a pinned or wip worktree is irreversible
tags: [session]
---

## Worktree and simulator cleanup

Reclaim disk by pruning merged or abandoned git worktrees and stale iOS simulators.

**Incorrect:** Hand-type worktree paths. Trust the audit bucket as permission. Delete `wip` without a decision.

**Correct:** You own the disk and the safety gate. Snapshot. Cross-check the pinned set. Pause on uncommitted work.

1. `df -h /`, then `scripts/worktree-audit.sh`. Paths come from `git worktree list`.
2. The pinned and active chats win over a `safe` bucket.
3. Verify usage before deleting. Sibling arena and repro trees count as in use.
4. Show the `wip` diff and get a decision. Clean, merged, not-in-use proceeds.
5. `git worktree remove --force`, then prune. Confirm with `df -h /`.
6. Simulators and named caches next, only ones the user has not said to keep.

Library: `ai/playbooks/worktree-cleanup.md` (dest: `playbooks/worktree-cleanup.md`).
