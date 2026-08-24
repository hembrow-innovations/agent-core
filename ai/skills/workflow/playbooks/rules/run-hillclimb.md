---
title: Hillclimb
impact: HIGH
impactDescription: Stacked untested changes invent a fake win
tags: [run]
---

## Hillclimb

Sustained improvement of one metric against a target. One change, one measurement, keep or revert.

**Incorrect:** A one-off perf patch. Claim a win from reading the code. Stack two hypotheses before measuring.

**Correct:** You own the metric. Freeze the harness. Loop hypotheses. The data decides.

1. Ground the workload with `how`. Fix one metric, the better direction, and a stop predicate with a floor on attempts.
2. Build the harness. Prove it is sensitive. Freeze it. Record the baseline.
3. Open a `decision.tsv` via `show-me-your-work`. Keep it out of the tree.
4. Each iteration: one hypothesis, measure, accept or revert in full, log the row.
5. Push past the first plateau. Do not relax the predicate.
6. Opening a PR with accepted commits in the order they landed.

Library: `ai/playbooks/hillclimb.md` (dest: `playbooks/hillclimb.md`).

Notes: A one-off slowness is `fix-perf`. An unattended wake borrows `run-autonomous` only for the wake, not the stop rule.
