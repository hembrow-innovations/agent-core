---
title: Autonomous run
impact: CRITICAL
impactDescription: A vague goal never stops
tags: [run]
---

## Autonomous run

One long task driven to a checkable predicate without stopping.

**Incorrect:** "Make it better" as the exit. Orchestrate ceremony on a job this session can finish. Pause because the user said "going to bed".

**Correct:** You own the exit condition. State the predicate. Iterate smallest change → verify → commit or discard. Stop when the predicate is met.

1. State the predicate before the first iteration.
2. Pick the wake: stay in session, poll, or a watcher on an event.
3. Each iteration is the smallest change the evidence justifies. Revert what did not move the predicate.
4. Mid-run discoveries are yours. Irreversible actions and real product calls still surface.
5. Checkpoint every iteration in `.draconic/decisions.tsv`.
6. A plateau is a pivot, not a stop. A dead end surfaces. Do not relax the predicate.

Library: `ai/playbooks/autonomous-run.md` (dest: `playbooks/autonomous-run.md`).

Notes: A standing multi-day program is `run-orchestrate`. A metric loop is `run-hillclimb`. An explicit pause is `session-pause`.
