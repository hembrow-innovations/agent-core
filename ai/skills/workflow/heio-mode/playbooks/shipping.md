### Shipping

**You own what lands.** For "land the stack", "ship it", "enable merge when ready", or the second half of a stack that **Babysit** already drove to green.

This is the half after `playbooks/babysit.md`. Babysit makes a stack mergeable. Shipping decides what is actually safe to merge. Green is not safe, and the gap between those two words is where this playbook lives.

This pack runs on Pi. Graphite shipping is degraded. Do one unit per session, prove it, open or land a PR with `gh`. Local `subagent` or in-process only. Do not pretend a cloud fleet ran. Use Graphite / `gt` only if the project already uses it.

1. **Verify this session's unit independently before arming anything.** Yourself or one local `scout` or `reviewer`, not batched, not a cloud agent. Exercise the real surface via the project `verify-*` skill against parent versus head. Return `PASS`, `PASS+NOTES` or `FAIL` and post that verdict on its own PR so the record outlives the chat. Safe means a verdict from an agent that did not write the code. CI green is not a verdict, and an approving bot review is not a verdict. Remaining PRs wait for later sessions.
2. **Land only the contiguous verified run rooted at the bottom.** Walk up from the lowest unmerged PR and stop at the first one without a passing verdict, where both `PASS` and `PASS+NOTES` pass. A verified PR sitting above an unverified one is not landable, because merging it would pull the gap in underneath it. If this session's unit is not the floor, report the ceiling as a PR number, say what breaks the chain, and stop.
3. **Re-check that the verdicts still describe the code.** A restack rewrites every SHA above it and silently invalidates every verdict without touching a single check. Compare `git patch-id` at the verdict SHA against the current head before trusting an older verdict, and re-verify anything that actually drifted. Twenty-one verdicts went stale this way in one run with no signal at all.
4. **Land with `gh`.** Default is `gh`. Merge only when the user explicitly asked to merge, land, ship, or merge when ready. If the project already uses Graphite, arm merge-when-ready through Graphite and pass `--always`. A no-op submit skips the Graphite update and silently arms nothing, which reads exactly like success.

   ```bash
   gt submit --merge-when-ready --always --update-only --no-interactive
   ```

5. **Never enable GitHub auto-merge on a stack.** Only the root targets protected trunk. Every child targets its unprotected parent branch and already reads `CLEAN`, so GitHub would merge children into parents immediately and collapse the stack into itself. If the project uses Graphite, Graphite is what makes the merges sequential. If a previous agent armed GitHub auto-merge, disarm with `gh pr merge <n> --disable-auto` and confirm the field is back off.
6. **Do not read `autoMergeRequest` as proof that MWR is armed.** It stays off until Graphite reaches that PR at the queue front, so an unarmed reading is meaningless and acting on it leads to re-submitting branches that were already fine. Confirm arming from Graphite's own state when using it, and if you cannot, say so rather than inferring it.
7. **Once this unit is landing, stop touching the stack.** No `gt sync`, no restack, no speculative pushes, and no `gt submit --stack`, which reaches downstack into PRs that are mid-merge. Even a plain `gt submit` can retarget a base if local Graphite tracking has diverged, so never run `gt` from a worktree whose parentage you have not just checked. Independent work gets re-parented onto trunk and shipped on its own.
8. **Watch the drain, do not drive it.** Stay in this session, or poll with bash, until this unit reaches COMPLETE at the ceiling. ADVANCE is progress, not termination. If the project uses Graphite, bases retarget and `graphite-base/*` refs get cut as each PR merges; that is Graphite working, not damage. Report each merge and the new ceiling. If the queue stalls, diagnose before mutating, because a stalled queue and a broken stack look identical from the outside.
9. **Stop at the ceiling.** When this session's verified unit is merged, report what landed, what the next unverified PR is, and what verifying it would take. Extending the run is a later session through step 1, not a judgment call you make at 3am.

**Reply:** the verified unit and its ceiling, the verdict and who produced it, what you armed or merged and how you confirmed it, what landed, and what the next gap needs.
