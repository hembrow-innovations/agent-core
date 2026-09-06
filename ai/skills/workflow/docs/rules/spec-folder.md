---
title: Spec folders
impact: HIGH
tags: [spec, layout]
---

# Spec folders

A spec is a **folder**, not a file. Humans walk domain → area → feature. Agents search stable filenames and read one concern.

Path: `docs/specs/<domain>/<area>/`. When the area has more than one coherent unit, nest `docs/specs/<domain>/<area>/<feature>/`.

`domain` in the path equals frontmatter `domain:`. `area` equals frontmatter `area:`. Feature slug is the concern (`crud`, `ui`, `members`), not a framework (`web`, `hooks`).

Skip a level when it would have a single child. No domains → `docs/specs/<area>/`. One unit → files live on the area. Create a folder when the first file needs it.

Worked shape (life-engine `docs/specs`):

```text
docs/specs/
  index.md
  features/                    domain
    calendar/                  small area — files on the area
      index.md
      purpose.md
      contract.md
      test.md
    tasks/                     large area — feature folders
      index.md
      purpose.md
      crud/
        contract.md
        test.md
      lists/
        contract.md
        test.md
  core/
    engines/
      index.md
      purpose.md
      data-map.md              optional
      members/
        contract.md
        test.md
```

## Files

- **purpose.md** — job, in/out of scope, surfaces, Authority wikilinks. One per area. Nested purpose only when that folder has its own job. Copy `templates/purpose.md`. Product outcome only — not how, not React Query, not file trees.
- **contract.md** — promises. Load **behaviour-contracts** and copy `templates/contract.md`. One coherent unit per file. `test:` pointers lock behaviour. This file does not narrate the suite.
- **test.md** — which tests cover this unit, how, and why. Copy `templates/test.md`. Lives beside the `contract.md` it covers. Paths, titles, how, why. Honest gaps. Does not replace `test:` locks.
- **index.md** — area hub of wikilinks to purpose, contracts, tests, ADRs. No duplicated promises.
- **data-map.md** — only when data topology is non-obvious.

A `spec-<slug>.md` is optional extra narrative inside the folder when purpose and contract cannot hold a how/shape note (CLI surface, protocol). It is not the living product spec.

## Write order

1. Place the folder.
2. Write `purpose.md` (job and fences).
3. Write or edit `contract.md` promises. Load **behaviour-contracts**.
4. Write `test.md` mapping the tests that cover those promises.
5. Point Authority and `index.md` at the new notes.

Done when the folder has purpose, every behaviour unit has contract + test.md, and the hub links them.

## Why nest

Stable filenames (`purpose.md`, `contract.md`, `test.md`) are the AI index — a glob for the kind is the catalog. The path is the human taxonomy. One concern per file so a task reads 1–3 notes, not a dump. Frontmatter `domain` + `area` match the path. Flattening all contracts into one file, or a flat `docs/specs/*.md`, loses both.
