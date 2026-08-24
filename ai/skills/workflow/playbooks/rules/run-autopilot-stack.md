---
title: Autopilot-stack
impact: HIGH
impactDescription: An owner that merges here ships what the operator withheld
tags: [run]
---

## Autopilot-stack

A queue built and verified with full autonomy, delivered as one linear stack the operator lands.

**Incorrect:** An owner merges, arms auto-merge, or closes. Append an unverified PR. Treat this as Autopilot-full with a different name.

**Correct:** You own the stack, never the landing. Same owner loop as full. A clean verdict appends a link. Nothing auto-ships.

1. Owner loop unchanged: build, proof, triage, babysit to green.
2. Audit on the wake chain.
3. Hold operator gates. State-then-wait.
4. Swarm-verify at STACK-READY.
5. Append on a clean verdict. Never ship.
6. Root owns topology. Owners push only their own branch.
7. Absorb drift at the root, then re-verify what moved.
8. Deliver the chain.

Library: `ai/playbooks/autopilot-stack.md` (dest: `playbooks/autopilot-stack.md`).

Notes: Independent PRs with landing authority granted is `run-autopilot-full`.
