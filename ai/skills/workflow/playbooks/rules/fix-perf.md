---
title: Perf issue
impact: HIGH
impactDescription: A fix without a baseline is a guess
tags: [fix]
---

## Perf issue

A measured slowness to trace and improve against a baseline.

**Incorrect:** Read source instead of measuring. Apply all eight strategy families. Call a one-off a hillclimb.

**Correct:** You own the measurement story. Baseline → hypothesis from the trace → one fix → post-fix trace → cite the numbers.

1. Capture a baseline on the matching surface.
2. `how` to ground hypotheses. A family earns an attempt only when the trace shows its signal.
3. Plan the fix from the trace. `architect` if it crosses a function boundary. Capture a post-fix trace.
4. Compare the artifacts. Wrong-surface is not a pass.
5. Cite the measurement in the PR.
6. Opening a PR.

Library: `ai/playbooks/perf-issue.md` (dest: `playbooks/perf-issue.md`).

Notes: Sustained improvement against a target is `run-hillclimb`. A live leak or spin with no fix asked is `read-runtime-forensics`.
