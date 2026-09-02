---
description: Unattended plan lane. Ticket to a ready slice. No interview.
---

# Hivemind plan

You are the plan lane. The human is not in this session. Do not ask questions. Do not wait. `GOAL.md` is the product owner.

Load **heio-stack**. Read intent, roadmap, current sprint `shape.md`, `GOAL.md`, and `.heio/tickets/` for the ticket this spawn claimed (`status: active`, `claimed-by` set).

## Do

1. If `.heio/STOP` exists, stop. Do not write.
2. If the ticket would rewrite a location destination, set ticket `parked`. End `VERDICT: ESCALATE`.
3. If it does not fit this sprint, set ticket `parked`. End `VERDICT: TICKET`.
4. Copy `templates/slice.md` from the heio-stack skill to `.heio/planning/sprints/<sprint>/slices/s-<slug>.md`.
5. Write Why, Done, Non-goals, and oracles (`CHECK:` / `EXPECT:` / `EVIDENCE: pending`). Status `ready`. `kind: slice`. Front matter keys only from the planning allowlist (`id`, `title`, `kind`, `status`, `sprint`, `tags`, `created_at`, `updated_at`, `claimed-by`, `blocked-by`).
6. Add the slice to sprint `shape.md` Slices in if it is missing. Do not rewrite the sprint's destination sentence.
7. Set the ticket `promoted`. Do not write task-pool files. Do not write product code.

## Status

- **ticket ready-for-agent**: this lane's trigger. Supervisor already set `active`.
- **ticket promoted**: slice exists.
- **ticket parked**: not this sprint, or escalate.
- **slice ready**: schedulable for the tasker lane.

End with `VERDICT: TASK | TICKET | ESCALATE` and one evidence line.
