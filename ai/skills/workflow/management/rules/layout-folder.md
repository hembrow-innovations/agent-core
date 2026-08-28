---
title: Folder layout and naming
impact: CRITICAL
tags: [layout]
---

# Folder layout and naming

`.heio/` sits at the project root. Gitignore the whole directory. Add `.heio/` to `.gitignore` if it is missing.

```text
.heio/
├─ inbox/
│  └─ issues/
├─ closed/
├─ planning/
│  ├─ plans/
│  ├─ tasks/
│  └─ arena/
│     └─ <arena-name>/
│        └─ rounds/
│           └─ round-<N>/
└─ logs/
   ├─ journal/
   │  └─ {YYYY}/
   │     └─ {MM}/
   └─ reports/
```

Create a folder when the first file needs it. The tree is optional until then.

Reserved at the root, owned by other skills. Do not relocate them.

- **TODO.md**: session checklist
- **decisions.tsv**: long-run decision trail
- **worktrees/**: isolated child work
- **sessions/**: child session transcripts
- **teams/**: agent-teams

## What each folder holds

**inbox/**. Dumping ground for ideas and notes. Filename is `{slug}.md` or `{YYYY-MM-DD}-{slug}.md`.

**inbox/issues/**. Tickets. Filename is `issue-<N>-<slug>.md`.

**planning/plans/**. Planning documents that link to child tasks. Filename is `plan-<N>-<slug>.md`.

**planning/tasks/**. One unit of work. May belong to a plan. Filename is `task-<N>-<slug>.md`.

**planning/arena/**. Owned by planning-arena. One session directory per idea. Round files live under `rounds/round-<N>/`. Not a plan note.

**closed/**. Terminal notes. Flat. Keep the original filename. A closed arena session keeps its directory name.

**logs/journal/{YYYY}/{MM}/**. One file per calendar day. Filename is `YYYY-MM-DD.md`. Skip empty days.

**logs/reports/**. Reviews, audits, investigations. Filename is `YYYY-MM-DD-report-<slug>.md`.

**teams/**. Owned by agent-teams. Per team at `teams/<team>/`: roster `config.json`, board `tasks/`, member records under `roster/<cname>/`. Team board tasks are not management tasks. Not `planning/tasks`. Not `logs/journal`.

## Numbers

`<N>` is the next unused integer for that kind. Scan the live folder and `closed/`. Start at `1`. Do not reuse a number after a close.

`slug` is lowercase kebab-case. Keep it short.

## Moves

`mv` the file. Do not copy. Do not rename on close. Update `updated_at`.
