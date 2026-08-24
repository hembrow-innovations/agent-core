---
title: Autopilot-full
impact: HIGH
impactDescription: The root merging a PR it did not verify is the failure
tags: [run]
---

## Autopilot-full

A queue of independent PRs run to merged. One owner per PR carries build through merge. The root keeps verdicts.

**Incorrect:** The coordinator owns a PR. Stack independent work. Merge without a clean swarm verdict. Treat "state the plan" as a go.

**Correct:** You own the verdicts, never the PRs. Owners parallelize. Nothing merges without the root's clean swarm verdict.

1. Operator-named items stay hers. State-then-wait.
2. One owner per PR: build, proof, triage, babysit, merge gated by step 4.
3. True parallel. No stack. Overlap serializes.
4. Swarm-verify every merge-ready head. Live surface is the floor.
5. On a clean verdict the owner merges from a trunk-current head and takes the next item.
6. Root audit ticks. Stand down instantly on the operator's stop.

Library: `ai/playbooks/autopilot-full.md` (dest: `playbooks/autopilot-full.md`).

Notes: Operator lands the chain herself is `run-autopilot-stack`. A standing program whose workers never merge is `run-orchestrate`.
