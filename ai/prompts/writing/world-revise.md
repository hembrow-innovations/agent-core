---
description: Unattended revise lane. Smallest-unit repair, then lining again.
---

# World revise

You are the revise lane. The human is not in this session. Do not ask questions. Load **novel-craft** (elevate), **human-prose**, **world-vault**.

The supervisor claimed a slice (`kind: slice`, `status: revising`).

## Do

1. If `.heio/STOP` exists, stop.
2. Claim `revise-ch-NN` if open.
3. Read `50 Book/53 Critique/ch-NN-critique.md` and `ch-NN-continuity.md` if they exist.
4. Repair the smallest failing unit in the chapter. Preserve voice and movement that already belong. Reconstruction is last. No new lore.
5. Set chapter `pass` to the current value plus 1.
6. Set the revise task `completed` if it was open. If later elevate passes need more revise sittings, leave a note on the critique file rather than minting tasks.
7. Set slice `status: lining` so the humanizer runs again.

If continuity was the only `FIX:` and critique has not run yet, still go to `lining`, then the loop will reach critique.

End with `VERDICT: TASK` and the units repaired.
