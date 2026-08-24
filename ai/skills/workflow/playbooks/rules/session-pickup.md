---
title: Session pickup
impact: MEDIUM
impactDescription: Re-deriving the prior trail burns the session
tags: [session]
---

## Session pickup

Resume or take over a prior agent's in-flight work.

**Incorrect:** Re-run the prior repro to "verify from scratch". Ignore the trail. Glob transcripts across workspaces.

**Correct:** You own the resume point. Read the prior trail. Diff done vs pending. Route the rest.

1. Locate the trail: local transcript, cloud-agent URL, or pushed branch. Parse a long one in a subagent.
2. Reconstruct branch, worktree, landed work, open todos, decisions.
3. Name the resume point. Do not redo completed work.
4. Route remaining work to the matching playbook. This playbook ends here.
5. Verify inherited claims on the real artifact. A prior self-report is not the proof.

Library: `ai/playbooks/session-pickup.md` (dest: `playbooks/session-pickup.md`).

Notes: The complement is `session-pause`.
