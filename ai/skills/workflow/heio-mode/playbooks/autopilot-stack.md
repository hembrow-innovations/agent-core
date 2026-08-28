### Autopilot-stack

**You own the stack, never the landing, never a fake fleet.** For "autopilot-stack", "stack them, don't ship", "build the stack, I'll land it". The sibling of **Autopilot-full**. The owner loop and the verification gate are the same; only the terminal differs. There a clean verdict authorizes the owner's merge. Here it appends a link to the one reviewed chain, and nothing auto-ships.

This pack runs on Pi. Autopilot-stack is degraded. Do one unit per session, prove it, open a PR with `gh`. Local `subagent` or in-process only. Do not pretend a cloud fleet ran.

1. **Run this session's owner loop.** Yourself or one local `subagent` `worker` with `worktree` true. Own the change end to end: build, registration of its own PR with `gh` (Graphite / `gt` only if the project already uses it), self-proof (gates, CI, receipts) via the project `verify-*` skill, skeptical Bugbot triage per `../references/bugbot-triage.md`, the **unslop** skill, a comment strip, and babysit to green per `playbooks/babysit.md`. Keep a `decisions.tsv` trail, never committed, returned in the report. Remaining queue items wait for later sessions.
2. **Audit in this session.** Stay in this session, or poll with bash. There is no cloud-sleeper wake chain. Probe liveness from the PR, the branch, and the decision trail.
3. **Hold the operator gates.** State-then-wait, so a request to state the plan is not a go. On her stop, take an immediate zero-writes hold.
4. **Verify at STACK-READY.** Report STACK-READY with the exact head SHA. Verify that SHA yourself or with a local `scout` or `reviewer`: re-run the gates at that SHA, a live runtime floor over the load-bearing behavior via the project `verify-*` skill, and a receipts-and-diff audit that distrusts the PR body. Findings go back for fix-forward, and nothing enters the stack unverified.
5. **Append on a clean verdict, never ship.** Do not merge, arm auto-merge, or close. A clean verdict opens or appends the PR with `gh`, in verified order or an order the operator specified. Use `gt` only if the project already uses it.
6. **Single writer on topology.** An owner pushes only its own branch, `git push --force-with-lease` after an ls-remote check, and reports its tip and intended parent. This session owns one unit. Do not pretend parallel cloud owners registered a stack.
7. **Absorb drift, then re-verify what moved.** Absorb trunk movement by rebasing or, if the project already uses Graphite, restacking (`gt restack`, `gt sync`). A restack rewrites every SHA above it and voids the verdicts at the old SHAs. Compare `git patch-id` at each verdict SHA against the new head. Anything that actually drifted goes back through step 4 before delivery. The countersign rule is unchanged from Autopilot-full. A genuinely new pin raises a stop for a fresh countersign; absorbing drift of landed values is not a raise.
8. **Deliver this link.** The program deliverable is one linear chain of verified PRs, reviewable bottom-up, every link carrying its verifier verdict in the PR body or a comment. This session delivers one link. The operator reviews and lands it, with her own clicks or with merge-when-ready she arms herself.

**Choosing between the autopilots.** Autopilot-full when the PRs are independent and landing authority is granted. Autopilot-stack when the operator wants review before landing, the work is sequenced or coupled, or merge authority is withheld.

**Reply:** the PR this session opened, a one-line verdict, anything parked or excluded with the reason, and remaining queue items for later sessions.
