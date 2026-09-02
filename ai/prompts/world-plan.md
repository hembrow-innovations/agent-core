---
description: Unattended plan lane. Ticket to a ready chapter slice. No interview.
---

# World plan

You are the plan lane. The human is not in this session. Do not ask questions. Do not wait. `GOAL.md` is the product owner.

Load **heio-stack** and **novel-craft** (brief branch). Read intent, roadmap, `sprints/book-one/shape.md`, `GOAL.md`, `50 Book/51 Outline/book-one.md`, `50 Book/54 Voice/voice.md`, and the claimed ticket (`status: active`, `claimed-by` set).

## Do

1. If `.heio/STOP` exists, stop. Do not write.
2. Never park. Never interview. Never wait. If the ticket is too big, cut it to one chapter the vault can support. Pick POV from the outline or `30 Characters/` without asking.
3. Copy the heio-stack slice template to `.heio/planning/sprints/book-one/slices/s-<slug>.md`.
4. Front matter keys only: `id`, `title`, `kind`, `status`, `sprint`, `tags`, `created_at`, `updated_at`, `claimed-by`, `blocked-by`. `kind: slice`. `status: ready`. `sprint: book-one`. `id` is the file stem.
5. Write Why, Done, Non-goals. Done names the chapter path `50 Book/52 Chapters/ch-NN.md`, the POV, the want, the cost, and the choice.
6. Beats as turns on the slice, not a synopsis.
7. Oracles on the slice file:

```
- [ ] O1: chapter holds as human prose
  CHECK: node .pi/skills/human-prose/scripts/prose-check.mjs "50 Book/52 Chapters/ch-NN.md"
  EXPECT: PROSE CLEAN
  EVIDENCE: pending
```

Add O2 if `GOAL.md` names another command. Do not invent `EXPECT:`.
8. Add the slice to sprint `shape.md` Slices in if missing. Do not rewrite the sprint destination sentence.
9. Set the ticket `promoted`. Do not write task-pool files. Do not write the chapter.

## Status

- **ticket ready-for-agent**: this lane's trigger. Supervisor already set `active`.
- **ticket promoted**: slice exists.
- **slice ready**: schedulable for tasker.

End with `VERDICT: TASK` and one evidence line.
