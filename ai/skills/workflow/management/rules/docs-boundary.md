---
title: docs is truth, .heio is local
impact: HIGH
tags: [docs]
---

# docs is truth, .heio is local

`.heio/` is working memory on this machine. Git ignores it. A clone does not see it.

`docs/` is the committed source of truth. ADRs, specs, architecture notes, and guides that the next person needs live there. Load the **docs** skill before you write under `docs/`.

Write here when the note is in-flight, private, or only useful while the work is open.

Write in `docs/` when the note should survive a clone, a new machine, or a future reader who never saw this checkout.

Do not keep two living copies. Promote a finished plan by writing the durable outcome as an ADR, spec, architecture note, or guide. Then close the working file. Do not copy a plan into `docs/` as a plan.

This skill stops at the `.heio/` tree.
