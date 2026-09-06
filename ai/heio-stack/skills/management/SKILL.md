---
name: management
description: Tracker for Tickets under `.heio/planning/tickets`, Splits and Slices under `.heio/planning/sprints and Tasks under `.heio/planning/tasks`. Use when triaging work, picking up a ready slice, ticket or task, closing or filing a note, or allocating a slice id.
---

# Management


A slice is `met` when every linked tasks id is `completed` and the oracles hold. Links are never dropped.

There is no GitHub Issues.
`docs/` is the committed source of truth. Load **docs** for vault standards. Do not put planning docs in `docs/`.

```
ticket ──▶ (`status: promoted`, to slices/tasks).
slice ──▶ task/s.
task ──▶ execute ──▶ review ──▶ close or create new ticket
```

**Notes = independent work-units.** A single-unit task is the executable.


Planning docs live under `.heio/planning`:
	- **intent**: why the project exists, success, non-goals. `.heio/planning/intent.md`
	- **roadmap**: locations as destinations, not a schedule. `.heio/planning/roadmap.md`
	- **location**: extra depth for one roadmap bullet. `.heio/planning/locations/location-N-<location_name>.md`.
	- **sprint**: grouping of slices. `shape.md` is the grouping. `.heio/planning/sprints/<sprint_name>/shape.md`
	- **slice**: one markdown file. Status, oracle checklist, durable links to tasks ids. `.heio/planning/sprints/<sprint_name>/slice-N-<slice-name>.md`
	- **task**: one markdown file in the task pool. `.heio/planning/tasks/task-N-<task_name>.md`
	- **round**: one sitting file. `kind: round`. `sitting-kind: planning` or `wayfinder` (frontmatter, not `mode`). Rounds append in that file. `.heio/planning/rounds/rounds-<NN>-<slug>.md`
	- **ticket**: inbound product signal. `.heio/planning/tickets/ticket-<NN>-<slug>.md`
	- **archive**: completed work, mirroring the live tree. `.heio/archive/index.md` plus `archive/planning/tasks/`, `archive/planning/sprints/`, `archive/planning/locations/`, `archive/planning/rounds/`, `archive/planning/tickets/`

## Status

- **intent**: `active` / `superseded`
- **roadmap**: `draft` / `active`
- **location**: `active` / `done`
- **sprint**: `shaping` / `active` / `review` / `closed`
- **slice**: `shaping` / `frozen` / `active` / `met` / `abandoned`
- **ticket**: `open` / `parked` / `promoted` / `dropped` / `closed`
- **task**: `draft` → `ready` → `claimed` → `implemented` → `completed`
- **round**: `awaiting-answers` → `ready-to-resume` → `awaiting-confirm` → `published`. `parked` is a side door


## Workflow

Work hangs off sprint grouping → slice → tasks files.

- **shape.md** lists which slices are in this grouping.
- A slice is one file. Name `blocked-by` when it waits on another slice. Unblocked slices may run in parallel.
- Oracles live on the slice file (`CHECK` / `EXPECT` / `EVIDENCE` / `ABANDON`).
- A planning sitting freezes the in-slices and publishes their tasks files in one pass. Each task is `ready` with `mode: afk` or `mode: hitl` and `blocked-by`.
- The slice keeps durable `[[id]]` links to those ids. Drain claims unblocked AFK tasks. HITL waits.
- Inbound product work is a ticket. Triage it into a tasks file (and link it), park it, or escalate it to the map.
- Completed work moves to archive. Completed task files move to `.heio/archive/planning/tasks/`. Closed sprints, done locations, and closed tickets move under the matching archive path. Add a one-liner to `archive/index.md`.


## Root and links

Tickets: `.heio/planning/tickets/`. Sprints, slices and tasks: `.heio/planning/{sprints/<sprint_name>/slice-N-<slice_name>.md ,tasks}/`. Closed notes go in `.heio/archive` (File tree mirrors `.heio/`).

`obsidian-axi` stays pinned at `docs/`. Do not use `obsidian-axi` for planning docs or `.heio/` operations. File with `mv`. Wikilinks inside this tree still resolve by basename.

From a planning note into `docs/`, write a repo path. Example: `docs/guides/intent-system.md`. Do not use a obsidian-axi wikilink for that hop. The two trees are different roots.

Templates live in this skill folder: `templates/ticket.md`, `templates/task.md`.

## 1. Ticket — `.heio/planning/tickets/tickets-<N>-<slug>.md`

Capture the problem. Template: `templates/ticket.md`.
`status: open | reviewing | promoted | ready | active | closed | wontfix`. Triage facets ride on `tags` and optional `ticket-type` / `severity`. Capture what and why. Do not design inside the ticket.

## 2. Make it executable

Once an ticket is accepted, decide how many independent work-units it is:

- **One unit** — tag `ready-for-agent` (`status: open` + that tag) and append `## Agent Brief` (scope / verification / acceptance). See **triage**. No task note. Behaviour change: the brief must list contract promise ids and a purpose link, or it is not ready.
- **Multiple units** — set `status: promoted` and fan out:
  - **Tasks** (`tasks-<N>-<slug>.md`, template `templates/task.md`) — one per independent unit. `status: hold | ready | active | complete`. Each `[[wikilink]]`s its ticket.
  - **Plan** (`plans-<N>-<slug>.md`, template `templates/title-of-the-plan.md`) — the approach across those tasks, when sequencing or risk warrants it. Skip for a simple 2-task split.

Need design first? Write an ADR or RFC under `docs/reference/decisions/` and link it with a repo path.

## 3. Execute

Pick the lowest-numbered ready unit. A ready task (`status: ready` + tag). One shared id sequence, lowest wins. Claim it: ticket → `status: reviewing`, task → `status: active`. On finish: a ready-for-agent ticket → `status: closed`. A task → `status: complete`, then close it.

Closing is a status flip and a `mv` into the terminal folder. The flip alone leaves the note in the active backlog.

After any close, this must print nothing:

```sh
grep -l "^status: \(closed\|wontfix\)" .heio/planning/tickets/*.md
grep -l "^status: complete" .heio/planning/tasks/*.md
```

## 4. Review

Write or update the day's journal at `docs/log/journal/<YYYY>/<MM>/YYYY-MM-DD.md` (template `journal-day.md` under **docs**). A self-contained dev-blog. Deep dives go in `docs/log/reporting/<YYYY>/<MM>/`. Verify acceptance. Capture leftovers as new tickets.

## 5. New tickets

Anything the review surfaces becomes a new ticket under `.heio/planning/tickets/`.

## Filing done and rejected work

Move a note the moment it leaves the active set:

- Ticket `status: closed` or `wontfix` → `.heio/arhive/planning/tickets/`
- sprint/slice complete or closed → `.heio/arhive/planning/sprints/<slice>/`
- Task `status: complete` or blocked → `.heio/planning/tasks/`

Status stays in frontmatter.

## Templates

Copy the matching file from `templates/`. Shared fields: `templates/required-fields.md`.

- **intent**: `templates/intent.md` → `.heio/planning/intent.md`
- **roadmap**: `templates/roadmap.md` → `.heio/planning/roadmap.md`
- **location**: `templates/location.md` → `.heio/planning/locations/<slug>.md`
- **sprint**: `templates/sprint-shape.md` → `.heio/planning/sprints/<id>/shape.md`
- **slice**: `templates/slice.md` → `.heio/planning/sprints/<id>/slices/s-<slug>.md`
- **ticket**: `templates/ticket.md` → `.heio/tickets/ticket-<NN>-<slug>.md`
- **task**: `templates/pool-task.md` → `.heio/planning/task-pool/<task>.md`
- **round**: `templates/round.md` → `.heio/planning/rounds/<NN>-<slug>.md`
- **archive index**: `templates/archive-index.md` → `.heio/archive/index.md`

## Allocating ids

One global sequence for tickets, tasks, and slices.

```sh
node scripts/planning-next-id.mjs
```

Never eyeball the highest number in an active folder. Re-run immediately before writing the file. `pnpm check:planning-ids` fails if two live notes share an id.

## Conventions

- Search `.heio/planning/` and `.heio/planning/` before creating a note.
- Never reach for `gh ticket`.
