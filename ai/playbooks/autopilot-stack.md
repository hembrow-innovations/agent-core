---
title: Autopilot-stack
when: "A queue of changes built and verified with full autonomy, delivered as one linear reviewed Graphite stack the operator lands herself (\"autopilot-stack\", \"stack them, don't ship\", \"build the stack, I'll land it\")."
---

### Autopilot-stack

**You own the stack, never the landing. Build and verify the queue with full autonomy, then hand the operator one linear reviewed chain she reviews and lands herself.** For "autopilot-stack", "stack them, don't ship", "build the stack, I'll land it". The sibling of **Autopilot-full**. The owner loop and the verification gate are the same; only the terminal differs. There a clean verdict authorizes the owner's merge. Here it appends a link to the one reviewed chain, and nothing auto-ships.

Pi has no Cursor cloud agents, no cloud-sleeper wake chain, and no dashboard. Local subagent or in-process only. Do one unit per session, prove it, open a PR with `gh`. Do not pretend a cloud fleet ran. Use `gt` only if the repo already uses it.

1. **Run the owner loop for this unit.** A writer is `subagent` as agent worker with `worktree` true. That owner owns the change end to end: build, self-proof (gates, CI, receipts), skeptical Bugbot triage as GitHub review-bot handling per `../references/bugbot-triage.md`, a slop-strip via the **unslop** skill, a comment strip, and babysit to green per `playbooks/babysit.md`. Keep a `decisions.tsv` trail, never committed, returned in its report. Register with `gt` only if the repo already uses Graphite.
2. **Audit in this session.** Probe liveness from the PR, the branch, and the local session. There is no cloud-agent liveness probe. Check progress and protocol adherence before you append.
3. **Hold the operator gates.** State-then-wait, so a request to state the plan is not a go. On her stop, take an immediate zero-writes hold.
4. **Verify at STACK-READY.** The owner reports STACK-READY with the exact head SHA. Independent verifiers are scout or reviewer subagents: re-run the gates at that SHA, prove the load-bearing behavior live with the project `verify-*` skill, and audit receipts and the diff while distrusting the PR body. Aggregate to one verdict. Findings go back to the owner, and nothing enters the stack unverified.
5. **Append on a clean verdict, never ship.** No owner merges, arms auto-merge, or closes. A clean verdict appends the PR to the reviewed chain, in verified order or an order the operator specified. One unit this session.
6. **Single writer on topology.** If the repo already uses Graphite, the owner pushes only its own branch, `git push --force-with-lease` after an ls-remote check, and reports its tip and intended parent. This chat owns stack topology and registers the append locally with `gt`. If the repo does not use Graphite, open or update the PR with `gh` and say the parent. Do not invent a `gt` workflow.
7. **Absorb drift here, then re-verify what moved.** If the repo uses Graphite, absorb trunk movement by restacking the chain (`gt restack`, `gt sync`); when a restack surfaces conflicts in this unit's files, fix that slice and push the result. A restack rewrites SHAs and voids verdicts at the old SHAs. Compare `git patch-id` at each verdict SHA against the new head. Anything that actually drifted goes back through step 4 before delivery. A genuinely new pin raises a stop for a fresh countersign; absorbing drift of landed values is not a raise.
8. **Deliver the chain.** The deliverable is the verified PR, or a short linear chain if the repo already stacks, every link carrying its verifier verdict in the PR body or a comment. The operator reviews and lands it. Do not pretend a cloud fleet built the stack.

**Choosing between the autopilots.** Autopilot-full when the PRs are independent and landing authority is granted. Autopilot-stack when the operator wants review before landing, the work is sequenced or coupled, or merge authority is withheld.

**Reply:** links to the stack root and tip, a one-line verdict summary per link, and anything parked or excluded with the reason.
