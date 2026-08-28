---
title: Shipping
when: The half after Babysit. Independently verifying a green stack, then landing the contiguous verified run. Graphite merge-when-ready only if the repo already uses it.
---

### Shipping

**You own what lands. Verify each PR independently, land only the verified run from the root, then keep your hands off the queue.** For "land the stack", "ship it", "enable merge when ready", or the second half of a stack that **Babysit** already drove to green.

This is the half after `playbooks/babysit.md`. Babysit makes a stack mergeable. Shipping decides what is actually safe to merge. Green is not safe, and the gap between those two words is where this playbook lives.

Pi has no Cursor cloud agents and no dashboard. Local subagent or in-process only. Do one unit per session, prove it, open or land a PR with `gh`. Do not pretend a cloud fleet ran. Use `gt` only if the repo already uses Graphite.

1. **Verify every PR independently before arming anything.** One scout or reviewer subagent per PR, not batched, not the writer, each exercising the real surface (the project `verify-*` skill) against parent versus head. Each returns `PASS`, `PASS+NOTES` or `FAIL` and posts that verdict on its own PR so the record outlives the chat. Safe means a verdict from an agent that did not write the code. CI green is not a verdict, and an approving bot review is not a verdict. One unit this session: verify the current PR, or the contiguous run you are actually landing now.
2. **Land only the contiguous verified run rooted at the bottom.** Walk up from the lowest unmerged PR and stop at the first one without a passing verdict, where both `PASS` and `PASS+NOTES` pass. A verified PR sitting above an unverified one is not landable, because merging it would pull the gap in underneath it. Report the ceiling as a PR number and say what breaks the chain.
3. **Re-check that the verdicts still describe the code.** A restack rewrites every SHA above it and silently invalidates every verdict without touching a single check. Compare `git patch-id` at the verdict SHA against the current head before trusting an older verdict, and re-verify anything that actually drifted.
4. **Land with `gh`.** Merge the verified run with `gh`. If the repo already uses Graphite, arm merge-when-ready through Graphite and pass `--always`. A no-op submit skips the Graphite update and silently arms nothing, which reads exactly like success.

   ```bash
   gt submit --merge-when-ready --always --update-only --no-interactive
   ```

   If the repo does not use Graphite, do not invent that workflow. Do not pretend a Graphite queue drained.
5. **Never enable GitHub auto-merge on a stack.** Only the root targets protected trunk. Every child targets its unprotected parent branch and already reads `CLEAN`, so GitHub would merge children into parents immediately and collapse the stack into itself. When the repo uses Graphite, that tool is what makes the merges sequential. If a previous agent armed GitHub auto-merge, disarm with `gh pr merge <n> --disable-auto` and confirm the field is back off.
6. **Do not read `autoMergeRequest` as proof that merge-when-ready is armed.** It stays off until Graphite reaches that PR at the queue front, so an unarmed reading is meaningless and acting on it leads to re-submitting branches that were already fine. Confirm arming from Graphite's own state when the repo uses it, and if you cannot, say so rather than inferring it.
7. **Once the queue is draining, stop touching the stack.** No `gt sync`, no restack, no speculative pushes, and no `gt submit --stack`, which reaches downstack into PRs that are mid-merge. Even a plain `gt submit` can retarget a base if local Graphite tracking has diverged, so never run `gt` from a worktree whose parentage you have not just checked. Independent work gets re-parented onto trunk and shipped on its own.
8. **Watch the drain, do not drive it.** Stay in this session or poll with bash over the verified run, re-armed after any verdict you act on, until COMPLETE at the ceiling. ADVANCE is progress, not termination. Bases retarget and `graphite-base/*` refs get cut as each PR merges when Graphite is in use; that is the stacker working, not damage. Report each merge and the new ceiling. If the queue stalls, diagnose before mutating, because a stalled queue and a broken stack look identical from the outside.
9. **Stop at the ceiling.** When the verified run is merged, report what landed, what the next unverified PR is, and what verifying it would take. Extending the run is a new pass through step 1 in a later session, not a judgment call you make at 3am.

**Reply:** the verified run and its ceiling, each PR's verdict and who produced it, what you armed and how you confirmed it, what landed, and what the next gap needs.
