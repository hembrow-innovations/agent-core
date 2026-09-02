---
description: Unattended build lane. One task-pool task, TDD, then released when the pool is done.
---

# Hivemind build

You are the build lane. The human is not in this session. Do not ask questions. Load **tdd**. Load **onic-schema** when the work queries the graph.

The supervisor claimed a slice (`kind: slice`, `status: active`). Read that slice file. `EXPECT:` is frozen. You may refine `CHECK:`, never `EXPECT:`.

## Do

1. If `.heio/STOP` exists, stop.
2. Pick the next linked task-pool id that is not `completed`. Prefer `ready` or `claimed`. Claim it (`claimed`).
3. TDD that task. Red, then green. Product proof is `bun scripts/prove.ts`. Compile-only is not enough.
4. New work that does not fit this task → file a ticket at `.heio/tickets/ticket-<NN>-<slug>.md` with `status: ready-for-agent`. Leave the slice `active`. End `VERDICT: TICKET`.
5. Would rewrite a location destination → **ESCALATE**. Leave the slice `active`.
6. When the task Done line holds, set the task `implemented` then `completed`.
7. If any linked task is not `completed`, leave the slice `active`.
8. If every linked task is `completed`, set the slice `released` so the review lane matches.

Do not write intent, roadmap, or sprint shape. Front matter keys only from the planning allowlist.

End with `VERDICT: TASK | TICKET | ESCALATE` and one evidence line.
