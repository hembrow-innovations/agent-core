---
name: planning-workflow
description: Historical vault tracker for docs/planning/ (replacing GitHub Issues and .scratch/). Prefer heio-stack `.heio/` when that OS is installed. Use when triaging vault issues, planning a feature in docs/planning, or closing the old issue → plan/tasks loop.
---

# Planning workflow

`docs/planning/` was the issue tracker. There is no GitHub Issues and no
`.scratch/` tracker. On dests that run **heio-stack**, live work is `.heio/`
and this skill is the vault convention for leftover `docs/planning/` notes.

Language completeness still uses `ROADMAP.md` + **draconic-loop** — do not
file ECMA-262 Loop atoms only as vault issues unless promoting out of the Roadmap.

**Notes = independent work-units.** A single-unit issue *is* the executable —
triage it `ready-for-agent` (+ `## Agent Brief`) and run it directly, no task
note. Spin out task children only when one issue fans into ≥2 parallel units.

## 1. Issue — `docs/planning/issues/issues-<N>-<slug>.md`

Capture the problem/opportunity. Template: `issue.md`.
`status: open | reviewing | promoted | closed | wontfix`. Triage facets on
`tags` and optional `issue-type` / `severity`.

## 2. Make it executable

- **One unit** — `status: open` + tag `ready-for-agent` + `## Agent Brief`
  (scope / verification / acceptance). No task note. Claim → `reviewing`; done →
  `closed` + move to `issues/closed/`.
- **Multiple units** — `status: promoted`, then tasks (`tasks-<N>-…`) and optional
  plan (`plans-<N>-…`).

## 3. Execute

Pick lowest-numbered ready unit. Claim before work. On finish flip status **and**
move terminal notes out of the active folder.

```sh
grep -l "^status: \(closed\|wontfix\)" docs/planning/issues/*.md
grep -l "^status: complete" docs/planning/tasks/*.md
# both should print nothing after filing
```

## 4. Review

Verify acceptance; file follow-ups as **new issues**.

## 5. New issues — close the loop

Gaps from review become new notes in `planning/issues/`.

## Filing done & rejected work

- Issue `closed` / `wontfix` → `docs/planning/issues/closed/`
- Plan complete / abandoned → `docs/planning/plans/completed/`
- Task complete / abandoned → `docs/planning/tasks/completed/`

Use link-safe moves when `notesmd-cli` is available; otherwise `git mv` and fix
broken wikilinks.

## Allocating ids

```sh
node scripts/planning-next-id.mjs
node scripts/planning-check-ids.mjs
```

Never eyeball the highest number in the active folder.

## Ops guide

`docs/reference/guides/issue-tracker.md` · `docs/reference/guides/triage-labels.md`
