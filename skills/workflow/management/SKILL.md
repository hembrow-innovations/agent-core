---
name: management
description: How to find, read, and write local project management under `.draconic/`. Working inbox, issues, plans, tasks, journal, and reports. Gitignored. `docs/` stays the committed source of truth. Use whenever you look for project work, add an issue, plan, or task, close a note, or write a journal or report.
---

# Management. Local working files

`.draconic/` is the local working tree for project management. It holds inbox notes, issues, plans, tasks, the daily journal, and one-off reports. Git ignores the folder. `docs/` is the committed source of truth.

There is no GitHub Issues tracker in this convention. Live work lives here.
Durable knowledge that should survive a clone is written into `docs/`. Load the **docs** skill for that tree.

Per-rule detail lives in `rules/<prefix>-*.md`. Copy-ready skeletons live in `templates/`.

If `AGENTS.md` or `WORKSPACE.md` already names a tracker (`.scratch/`, `docs/planning/`, GitHub Issues), that file wins. Do not start a second tree.

## Before writing (always)

1. Search `.draconic/` first. Update in place over near-dupes.
2. Pick the kind. Copy the matching file from `templates/`.
3. Place and name per `layout-folder` and the template convention.
4. Leave reserved root files alone (`TODO.md`, `decisions.tsv`, `worktrees/`, `sessions/`).

Full steps: `rules/write-before.md`.

## When to apply

- Finding or reading working notes under `.draconic/`
- Adding or updating an issue, plan, task, journal day, or report
- Closing work and moving it out of the live folders
- Choosing a path, filename, frontmatter field, or status
- Deciding whether a note belongs in `.draconic/` or `docs/`

## Prefer / careful / do not

### Prefer

- **write-before** before any new note
- **layout-folder** for path and naming
- **note-standards** for frontmatter, status, tags, and the h1 rule
- **template-kinds** plus `templates/<kind>.md` for the skeleton
- **lifecycle-flow** for issue to plan to task to close
- **docs-boundary** when the note should outlive this machine

### Careful

- **docs-boundary.** A finished plan is not the lasting record. Promote the durable outcome into `docs/` before you move the working files to `closed/`.
- **lifecycle-flow.** Do not design the solution inside an issue. That belongs on the plan.

### Do not

- Commit `.draconic/`
- Treat `.draconic/` as the project's second brain
- Invent a folder under `.draconic/` that `layout-folder` does not name
- Open a GitHub Issue for work this tree already tracks
- Use relative `.md` paths between notes (use `[[wikilinks]]` on the `id`)
- Move `TODO.md`, `decisions.tsv`, `worktrees/`, or `sessions/` into inbox, planning, or logs

## Rule categories by priority

- **1 CRITICAL** - Before writing (`write-`)
- **2 CRITICAL** - Folder layout (`layout-`)
- **3 CRITICAL** - Note standards (`note-`)
- **4 HIGH** - Templates (`template-`)
- **5 HIGH** - Lifecycle (`lifecycle-`)
- **6 HIGH** - Docs boundary (`docs-`)

## Quick reference

### 1. Before writing (CRITICAL)

- `write-before` - Search first, pick kind, place, leave reserved files alone

### 2. Folder layout (CRITICAL)

- `layout-folder` - Tree, naming, numbers, gitignore, reserved root

### 3. Note standards (CRITICAL)

- `note-standards` - Shared frontmatter, status machines, tags, h1 equals title

### 4. Templates (HIGH)

- `template-kinds` - Kind to template file to destination. See `templates/`

### 5. Lifecycle (HIGH)

- `lifecycle-flow` - Inbox to issue to plan and tasks to close

### 6. Docs boundary (HIGH)

- `docs-boundary` - `docs/` is truth. `.draconic/` is local working files

## How to use

```
rules/write-before.md
rules/layout-folder.md
rules/note-standards.md
rules/template-kinds.md
rules/lifecycle-flow.md
rules/docs-boundary.md
templates/required-fields.md
templates/<kind>.md
```

Read only the rules for the current task. Do not bulk-read `rules/` or every template.

Committed truth (ADR, spec, architecture, guide). Load the **docs** skill.
