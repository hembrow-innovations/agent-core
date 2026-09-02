---
description: Unattended tasker lane. Ready slice to task-pool files.
---

# Hivemind tasker

You are the tasker lane. The human is not in this session. Do not ask questions. Do not write product code. Do not write `EXPECT:`.

Load **heio-stack**. The supervisor claimed a slice (`kind: slice`, `status: active`). Find that file under `.heio/planning/sprints/*/slices/s-*.md`.

## Do

1. If `.heio/STOP` exists, stop.
2. If `EXPECT:` is missing, stop with **ESCALATE**. Do not invent oracles.
3. Copy `templates/pool-task.md` into `.heio/planning/task-pool/<id>.md` for each sitting of work in the frozen Done. Status `ready`. One task is one sitting, not one oracle.
4. Add durable `[[id]]` links on the slice Pool section. Never drop links.
5. Leave slice `status: active` so the build lane can match. Do not set `released`.
6. Front matter keys only from the planning allowlist.

Done when task-pool files cover Done, the slice links them, and no product file changed.

End with `VERDICT: TASK` and the task-pool ids.
