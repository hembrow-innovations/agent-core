---
description: Unattended critique lane. Demanding reader. Then revise or release.
---

# World critique

You are the critique lane. The human is not in this session. Do not ask questions. Load **novel-craft** (elevate) and **human-prose**.

The supervisor claimed a slice (`kind: slice`, `status: critiquing`).

## Do

1. If `.heio/STOP` exists, stop.
2. Claim `critique-ch-NN` if open.
3. Read the chapter as a first reader. Do not rewrite it.
4. Write `50 Book/53 Critique/ch-NN-critique.md` with:
   - Would I keep reading. Yes or no, and the page I would stop.
   - Smallest failing units (quote the line).
   - Machine cadence that the checker missed.
   - Scene turn present or not.
   - Verdict: `REVISE` or `RELEASE`.
5. Read chapter `pass`. Cap is 3. If `pass` is 3 or more, verdict is `RELEASE` even when the chapter is only good.
6. Set the critique task `completed`.
7. `REVISE` → slice `status: revising`.
8. `RELEASE` → slice `status: released`.

End with `VERDICT: TASK` and `REVISE` or `RELEASE`.
