---
title: Folder layout and naming
impact: CRITICAL
tags: [layout]
---

# Folder layout and naming

`.heio/` sits at the project root. Gitignore the whole directory. Add `.heio/` to `.gitignore` if it is missing.

```text
.heio/
├─ tickets/
│  └─ ticket-01-<slug>.md
├─ pool/
│  └─ <task>.md
├─ archive/
│  ├─ index.md
│  ├─ tickets/
│  ├─ pool/
│  └─ planning/
│     ├─ locations/
│     └─ sprints/
└─ planning/
   ├─ intent.md
   ├─ roadmap.md
   ├─ locations/
   │  └─ <slug>.md
   └─ sprints/
      └─ <sprint-id>/
         ├─ shape.md
         └─ slices/
            └─ s-<slug>.md
```

Create a folder when the first file needs it. `planning/locations/` exists only when a location needs a file. `archive/` exists on the first move.

`.heio/pool/` is one markdown file per task. Completed pool files are moved on completed to `.heio/archive/pool/`.

A slice is one markdown file: status, oracle checklist, durable pool-id links. Sprint `shape.md` stays the grouping. Slice `met` means linked pool ids are `completed` and oracles hold. Links are never dropped.

Parked tickets live in `.heio/tickets/`, never in a slice.

Reserved at the root, owned by other skills. Leave them in place.

- **TODO.md**: leftover stub. Not the live list. Live todos are the `todo` tool. Do not write a playbook checklist here.
- **decisions.tsv**: long-run decision trail
- **oracles.md**: root ledger owned by the **oracle** skill. Slice ledgers live on the slice.
- **worktrees/**, **sessions/**, **teams/**: runtime

## Names

- **sprint-id**: short folder name (`week-1`, `auth-working`). The id is the folder. A location name or a timebox.
- **location file**: `locations/<slug>.md`. Lowercase kebab-case. Only when the roadmap bullet needs depth.
- **slice file**: `s-<slug>.md`. Lowercase kebab-case.
- **ticket**: `ticket-<NN>-<slug>.md`. `<NN>` is the next unused integer, zero-padded to two digits. Scan `.heio/tickets/`. Start at `01`. Do not reuse a number.

`slug` is lowercase kebab-case. Keep it short.

## Status

- **intent**: `active` / `superseded`
- **roadmap**: `draft` / `active`
- **location**: `active` / `done`
- **sprint**: `shaping` / `active` / `review` / `closed`
- **slice**: `shaping` / `frozen` / `active` / `met` / `abandoned`
- **ticket**: `open` / `parked` / `promoted` / `dropped` / `closed`
- **pool**: `draft` / `ready` / `claimed` / `implemented` / `completed`

## Archive

`.heio/archive/` mirrors `tickets/` and `planning/`. Closed sprint folders, closed tickets, and done location files **move**. Done location bullets leave the live roadmap. Add a one-liner to `archive/index.md` that says what landed.

Do not scan archive when listing live sprints, slices, or open tickets.

## Links

Link notes with `[[id]]`. The `id` is the stem or folder name (`ticket-01-login-flash`, `s-login`, `week-1`, `auth-working`). Carry enough ADRs, specs, and paths on the note that a stranger does not hunt.
