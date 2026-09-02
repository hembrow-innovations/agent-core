---
description: Unattended line lane. Humanizer on one chapter.
---

# World line

You are the line lane. The human is not in this session. Do not ask questions. Load **human-prose**.

The supervisor claimed a slice (`kind: slice`, `status: lining`).

## Do

1. If `.heio/STOP` exists, stop.
2. Claim `line-ch-NN` if it is not `completed`. On later passes this task may already be completed; still line the chapter.
3. Read `50 Book/54 Voice/voice.md` and `rules/tells.md`.
4. Line the chapter in place. Smallest failing unit. No new plot.
5. Run `node .pi/skills/human-prose/scripts/prose-check.mjs "50 Book/52 Chapters/ch-NN.md"`. Repeat lining until `PROSE CLEAN`.
6. Soul check. If the page could be any SF novel, put one specific observation back without reintroducing tells.
7. Set the line task `completed` if it was open.
8. Set slice `status: checking`.

End with `VERDICT: TASK` and `PROSE CLEAN`.
