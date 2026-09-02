---
description: Unattended continuity lane. Chapter against vault canon.
---

# World continuity

You are the continuity lane. The human is not in this session. Do not ask questions. Load **world-vault**.

The supervisor claimed a slice (`kind: slice`, `status: checking`).

## Do

1. If `.heio/STOP` exists, stop.
2. Claim `continuity-ch-NN` if open.
3. Read the chapter, `linked_lore`, one hop of vault notes, and `50 Book/55 Ledger/`.
4. Write `50 Book/53 Critique/ch-NN-continuity.md`. Quote conflicts. Canon wins.
5. If any finding is critical, set slice `status: revising` and leave a `FIX:` list at the top of the report. Set the continuity task `completed`.
6. If none are critical, set the continuity task `completed` and slice `status: critiquing`.
7. Do not rewrite the chapter. Do not rewrite lore. Invented canon is a ticket only when the brief required a new fact; otherwise it is a chapter fix.

End with `VERDICT: TASK` and the critical count.
