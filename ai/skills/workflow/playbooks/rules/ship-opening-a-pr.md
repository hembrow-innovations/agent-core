---
title: Opening a PR
impact: HIGH
impactDescription: A fat PR or a babysitting subagent stalls the stack
tags: [ship]
---

## Opening a PR

Invoked at the end of every other build or fix playbook.

**Incorrect:** One fat PR. Commit bodies that restate the subject. A subagent that babysits.

**Correct:** Worktree off main. Small ordered commits. `unslop` the prose. Open. The parent babysits.

- Work from a git worktree off main. Dirty unrelated work gets patched out.
- Commit liberally. Rebase into landable slices before opening.
- `/unslop` the description and commit bodies. `/no-comments` before review.
- Five narrow PRs over one fat one. Stack follow-ups. Branch off main only for independent work.
- After opening, the parent runs Babysit. A subagent that opened the PR returns the URL and does not babysit.

Library: `ai/playbooks/opening-a-pr.md` (dest: `playbooks/opening-a-pr.md`).

Notes: Green is `ship-babysit`. Land is `ship-shipping`.
