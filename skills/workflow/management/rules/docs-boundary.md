---
title: docs is truth, .draconic is local
impact: HIGH
tags: [docs]
---

# docs is truth, .draconic is local

`.draconic/` is working memory on this machine. Git ignores it. A clone does not see it.

`docs/` is the committed source of truth. Plans, ADRs, specs, and reports that the next person needs live there.

Write here when the note is in-flight, private, or only useful while the work is open.

Write in `docs/` when the note should survive a clone, a new machine, or a future reader who never saw this checkout.

Do not keep two living copies. If you promote a plan or report into `docs/`, the `.draconic/` file becomes the working residue. Close it and move it.

If the project has a docs skill, follow that skill for anything under `docs/`. This skill stops at the `.draconic/` tree.
