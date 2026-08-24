---
title: Pause safely
impact: MEDIUM
impactDescription: Stopping mid-edit leaves a broken tree
tags: [session]
---

## Pause safely

Suspend in-flight work so a cold-start agent can resume.

**Incorrect:** Pause because the user said "keep going". Open a PR to pause. Stop mid-edit.

**Correct:** You own a clean stop. Finish or back out the current step. Make the work durable. Leave a resume note.

1. Stop at a safe boundary. Cancel nested subagents. Start nothing new.
2. No PR and no push unless you already had one out.
3. Commit uncommitted edits as one `wip:` commit. Say if the tree is broken.
4. Write the resume note off-context. Point at an existing `show-me-your-work` trail instead of duplicating it.

Library: `ai/playbooks/pause-safely.md` (dest: `playbooks/pause-safely.md`).

Notes: "Don't stop" is `run-autonomous`. Resume is `session-pickup`.
