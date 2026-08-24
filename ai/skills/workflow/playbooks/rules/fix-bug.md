---
title: Bug fix
impact: CRITICAL
impactDescription: A fix without a repro cannot be proven
tags: [fix]
---

## Bug fix

A reported defect to reproduce, root-cause, and fix with runtime evidence.

**Incorrect:** Patch from a plausible read of the source. Hand the repro to the user. Ship belt-and-suspenders that "might help".

**Correct:** You own the task. Reproduce on the matching surface → binary-search the cause → plan the fix → verify the original repro → Opening a PR.

1. Reproduce it yourself on the matching surface. Synthesize the trigger if it will not fire.
2. Form hypotheses. Seed with `how` and `why`. Cut the remaining space each pass. Confirm the mechanism with runtime evidence before `architect`.
3. Plan the fix. `architect` if it crosses a function boundary. Delegate the diff. Review it.
4. The original repro now passes on the same surface. Unit tests are not bug absence.
5. Stage the failing repro before the fix. `tdd` when a cheap local test exists.
6. Opening a PR.

Library: `ai/playbooks/bug-fix.md` (dest: `playbooks/bug-fix.md`).

Notes: A cited answer with no code is `read-investigation`. One measured slowness is `fix-perf`.
