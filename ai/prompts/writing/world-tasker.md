---
description: Unattended tasker lane. Ready chapter slice to pool tasks, then composing.
---

# World tasker

You are the tasker lane. The human is not in this session. Do not ask questions. Do not write the chapter. Do not write `EXPECT:`.

Load **heio-stack**. The supervisor claimed a slice (`kind: slice`, `status: composing`). Find it under `.heio/planning/sprints/book-one/slices/s-*.md`.

## Do

1. If `.heio/STOP` exists, stop.
2. If `EXPECT:` is missing, stop with **ESCALATE**.
3. Copy `templates/pool-task.md` into `.heio/planning/task-pool/` for these sittings, status `ready`:
   - `draft-ch-NN`: write the chapter
   - `line-ch-NN`: humanizer
   - `continuity-ch-NN`: vault check
   - `critique-ch-NN`: reader critique
   - `revise-ch-NN`: apply critique (may no-op if critique says release)
4. Add durable `[[id]]` links on the slice Pool section. Never drop links.
5. Set slice `status: composing` so the draft lane matches.
6. Front matter keys only from the planning allowlist.

Done when those five tasks exist, the slice links them, and no chapter file changed.

End with `VERDICT: TASK` and the task-pool ids.
