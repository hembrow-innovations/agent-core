---
title: Opening a PR
when: Invoked at the end of every other playbook.
---

### Opening a PR

Invoked at the end of every other playbook.

**Worktree.** Work from a git worktree off main; writer subagents inherit it. Writers are `subagent` as agent worker with `worktree` true. Read-only subagents are scout or reviewer. Multiple writer subagents on the same branch each get their own worktree, or `git fetch && git reset --hard origin/<branch>` between them. Dirty branch with unrelated work: patch out, fresh worktree, apply. Snarled worktree: reset from main, redo minimally.

**Commits.** Commit liberally; rebase into small, ordered commits before opening PRs. Each commit is a future PR: landable, ordered to tell the story. Amend when the fix belongs in a just-made commit; new commit when separable.

**PRs.** Apply the **unslop** skill to the diff before commit; strip narrating comments before review; apply the **unslop** skill to the PR description and commit bodies. Small PRs, 5 narrow over 1 fat; stack follow-ups, branch off main only for genuinely independent work. For stacked PRs, use `gt` only if the repo already uses Graphite; otherwise `gh`. The principle is small, ordered slices with the stack visible to reviewers. `gh pr view <number>` before referencing PR status. Rebase on `main` before substantial stack work. No `## Summary` / `## Test plan` boilerplate on small PRs; commit bodies don't restate the subject. After opening, run the **Babysit** playbook (`playbooks/babysit.md`); this playbook owns those requests, so do not route elsewhere. Push back when feedback drifts from intent.

A subagent that opens a PR runs the **unslop** skill and strips narrating comments, returns the URL, and does NOT babysit. Return to the parent.
