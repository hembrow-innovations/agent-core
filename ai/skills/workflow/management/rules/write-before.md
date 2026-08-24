---
title: Search first, then place
impact: CRITICAL
tags: [write]
---

# Search first, then place

Do this before any new note.

1. Search `.draconic/` for the same problem, plan, or task. Include `closed/`.
2. If a near-dupe exists, update that file. Do not start a second one.
3. Pick the kind. See `template-kinds`.
4. Copy `templates/<kind>.md` into the destination the template names.
5. Fill required frontmatter from `templates/required-fields.md`.
6. Set `id` to the filename stem. Set the h1 to the same string as `title`.

Create the parent directory on first write. Do not scaffold empty folders.

A loose thought with no ticket yet is a dump in `.draconic/inbox/`. Promote it to an issue when it becomes work.

Leave these root files where they are:

- `TODO.md`
- `decisions.tsv`
- `worktrees/`
- `sessions/`
