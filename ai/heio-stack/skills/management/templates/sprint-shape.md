---
id: week-1
type: doc
kind: sprint
title: <sprint_title>
domain: <domain>   # domain the doc concerns, e.g. system
created_at: <iso_date>
updated_at: <iso_date>
closed_at: <iso_date> # Optional, added when the sprint is closed
---
### Sprint Model

**Location**: `.heio/planning/sprints/<sprint_name>/`
**Filename**: `shape.md`

A grouping of slices. Named after a location or a timebox (`week-1`). The id is the folder. `shape.md` lists which slices are in, which stay out, and what this grouping is. Slice files hang under this folder; this file stays the grouping.

#### Frontmatter

_Required frontmatter fields always included_

```yaml
...Required frontmatter fields
title: "sprint title"
description: "one sentence description"
status: "shaping" | "active" | "review" | "closed"
tags: ["list of tags"]
created_at: <iso_date>
updated_at: <iso_date>
```

Status is a 4-state machine enum:

- `shaping` — the way is still fog; slice files and the task pool wait
- `active` — a planning sitting froze the in-slices and published their tasks
- `review` — grouping is ending; keep, cut, or rewrite the next slices
- `closed` — folder moved to `.heio/archive/planning/sprints/<sprint_name>/`

Everything else a sprint can “be” (location-named, timebox, recovery…) rides on **tags**, not status.

#### Body / Content

```markdown
# {Title}

## Grouping
Timebox `week-1`, or location: <roadmap bullet>. Why these slices share a folder.

## Slices in
- [[slice-N-slug]]: why this vertical cut is in, what we demo or learn. blocked-by: none
- [[slice-N-slug]]: why this vertical cut is in. blocked-by: [[slice-N-slug]]

## Slices out
- not this grouping: why it stays out

## Relations
- Intent: [[intent]]
- Roadmap: [[roadmap]]
- Location this grouping cuts: [[location-N-slug]]
- In-slices: [[slice-N-slug]]
- Sitting that froze this grouping: [[rounds-NN-slug]]

## See also
- Durable docs: `docs/...` (ADR, spec, architecture)
- Archive index line once closed
```

The h1 `Title` string must match the string of the `title` frontmatter field.

**Required sections (advisory, i2):** the kind registry records `Grouping` and
`Slices in` as the required body sections for a `sprint`. They are
scaffolded on create and reported by `doctor`/`lint` when missing — a SOFT
advisory, never a write-time error. The remaining headings above are recommended
but optional. Overridable per project via
`[kinds.sprint] required-sections = [...]` in `config.toml`.
