---
name: heio-stack
description: Heio-stack operating loop under `.heio/planning`, `.heio/tickets`, `.heio/pool/`, and `.heio/archive`. Intent, locations, sprints, slices, tickets, pool tasks, tasks, and oracles. Use when finding or writing those notes, triaging inbound work as TASK/TICKET/ESCALATE/VERIFY, or when another skill needs the stack.
---

# Heio-stack. Local operating loop

`.heio/planning/`, `.heio/tickets/`, `.heio/pool/`, and `.heio/archive/` are the working tree. Git ignores `.heio/`. `docs/` is the committed source of truth. Load **docs** for that vault. Load **domain-modeling** when a term or ADR belongs there.

This tree is the tracker. If `AGENTS.md` or `WORKSPACE.md` already names a tracker, that file wins. Do not start a second tree.

The map is **locations**. A sprint groups slices. Per-rule detail lives in `rules/`. Copy-ready skeletons live in `templates/`.

## Before writing (always)

1. Search `.heio/` first, including `archive/`. Update in place over near-dupes.
2. Pick the kind. Copy the matching file from `templates/`.
3. Place and name per `layout.md`.
4. Leave reserved root files alone.

Full steps: `rules/write-before.md`.

## When to apply

- Finding or writing intent, roadmap, location detail, sprint shape, slice spec, slice oracles, slice tasks, a ticket, a pool task, or an archive entry
- Triaging inbound work as TASK, TICKET, ESCALATE, or VERIFY
- Deciding whether a note belongs in `.heio/` or `docs/`
- Closing a slice or a sprint, or moving finished work to archive

## Prefer / careful / do not

### Prefer

- **write-before** before any new note
- **layout** for path and naming
- **layers** for intent vs map vs work
- **loop** for every output
- **pool** for pool statuses
- **template-kinds** plus `templates/` for the skeleton

### Careful

- **change.** Inbound product work is a ticket. Map hygiene is not.
- **oracles.** `--reverify` is a different pass. `EXPECT:` freezes with the slice.
- **tasks.** Frozen or active slices may have them. TDD is the build grain; oracles prove the slice.

### Do not

- Commit `.heio/`
- Treat `.heio/tickets/` as a second brain
- Rewrite location destination sentences from a builder pass
- Write tasks before the slice is `frozen`
- Invent a folder under `.heio/` that `layout.md` does not name

## Rule categories by priority

- **1 CRITICAL** - Before writing (`write-`)
- **2 CRITICAL** - Folder layout (`layout`)
- **3 CRITICAL** - Layers (`layers`)
- **4 CRITICAL** - Loop (`loop`)
- **5 HIGH** - Templates (`template-`)
- **6 HIGH** - Tickets, sprints, slices, oracles, tasks, change, pool

## Quick reference

- `write-before` - Search first (including archive), pick kind, place, leave reserved files alone
- `layout` - Tree, naming, status, links, archive
- `layers` - Intent sticky, map editable outside a workflow, work fluid
- `loop` - TASK / TICKET / ESCALATE / VERIFY
- `pool` - Statuses draft → ready → claimed → implemented → completed; anyone may draft; planning or triage marks ready; a builder skill claims and stops at implemented unless the invoked prompt is through-to-complete; whoever sets completed moves the file to `.heio/archive/pool/`; reviewer does not hunt archive for work
- `template-kinds` - Kind to template to destination
- `tickets` - Inbound signal, triage, rot at sprint close
- `sprints` - Grouping of slices, location or timebox
- `slices` - Vertical cut, freeze then tasks, parallel unless blocked
- `oracles` - CHECK / EXPECT / ABANDON, `--reverify`
- `tasks` - Frozen or active slice, TDD grain
- `change` - Tickets are product signals; workflow guards destination sentences

## How to use

```text
rules/write-before.md
rules/layout.md
rules/layers.md
rules/loop.md
rules/pool.md
rules/template-kinds.md
rules/tickets.md
rules/sprints.md
rules/slices.md
rules/oracles.md
rules/tasks.md
rules/change.md
templates/required-fields.md
templates/<kind>.md
```

Read only the rules for the current task. Do not bulk-read `rules/` or every template.

Chart locations and sprints with **heio-wayfinder**. Plan a slice or ticket with **heio-planning**. Execute a frozen slice with **heio-slice**.

Committed truth (ADR, spec, architecture, guide). Load the **docs** skill.
