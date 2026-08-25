---
title: Multi-phase or multi-PR plan
impact: CRITICAL
impactDescription: Planning that starts coding loses the deliverable
tags: [plan]
---

## Multi-phase or multi-PR plan

Work that spans phases or stacked PRs. The plan is the deliverable. Do not implement.

**Incorrect:** Start coding while writing the plan. One fat phase. Skip the pin on current behavior.

**Correct:** Triage, then write a phased plan grounded in principals. Hand it back. The user starts implementation.

1. Skip the plan when the change is one or two files with an obvious approach.
2. Load principals. Pick the rule ids this plan needs.
3. State scope and constraints. Ask only for genuine product or preference.
4. Explore in subagents. Keep pointers, not dumps.
5. Write `NN-slug.md`, or a directory with `overview.md` plus phase files when there are three or more phases.
6. Each phase names static and runtime verification.
7. Stop. Summarize. Do not implement.

Library: `ai/playbooks/multi-phase-plan.md` (dest: `.pi/playbooks/multi-phase-plan.md`).

Notes: A large migration you will also run is figure-it-out. A standing program is `run-orchestrate`.
