---
id: rounds-NN-slug
type: doc
kind: round
title: <sitting_title>
domain: <domain>   # domain the doc concerns, e.g. system
sitting-kind: <"planning" | "wayfinder">
created_at: <iso_date>
updated_at: <iso_date>
published_at: <iso_date> # Optional, added when the sitting is published
---
### Round Model

**Location**: `.heio/planning/rounds/`
**Filename**: `rounds-<NN>-<slug>.md`

One sitting file. The grill lives here. Later rounds append in this file. This file does not publish: no frozen slices, no task write, no intent / roadmap / sprint-shape write until a later sitting does that work. `<NN>` is the next unused integer, zero-padded to two digits. Slug is lowercase kebab-case.

#### Frontmatter

_Required frontmatter fields always included_

```yaml
...Required frontmatter fields
title: "sitting title"
description: "one sentence description"
status: "awaiting-answers" | "ready-to-resume" | "awaiting-confirm" | "published"
sitting-kind: "planning" | "wayfinder"
tags: ["list of tags"]
created_at: <iso_date>
updated_at: <iso_date>
```

Status is a 4-state machine enum. `parked` is a side door, not on the happy path:

- `awaiting-answers` — current round has questions; answers are not in yet
- `ready-to-resume` — answers are in; the frontier may still have a next round
- `awaiting-confirm` — frontier is empty; Confirm is filled; stop. Do not publish from here
- `published` — a later sitting wrote the settled artifacts; this file may move to `.heio/archive/planning/rounds/`

##### `sitting-kind`

Closed vocabulary. Frontmatter key is `sitting-kind`, **not** `mode` (`mode` is a task execution facet).

- `planning` — destination first when intent or locations are missing; otherwise this sprint's tracer bullets (slice Done, oracles, `blocked-by`, AFK or HITL). Fog last
- `wayfinder` — destination first. That round includes nothing that hangs off it. Then locations, fog, current sprint as a named grouping. No slice files, no task files

#### Body / Content

```markdown
# {Title}

## Round 1

### Questions
1.

### Answers
1.

Later rounds append in this file as `## Round N` with the same questions/answers skeleton. At most 4 questions per round. The frontier is every decision whose prerequisites are already settled. A question that depends on another still open in this round belongs later.

## Confirm
Filled when the frontier is empty:

- Destination
- In-slices: each Done + `EXPECT:` (wayfinder: none)
- Tracer-bullet list: title, slice, blocked-by, AFK or HITL

## Relations
- Intent this sitting may settle: [[intent]]
- Roadmap this sitting may settle: [[roadmap]]
- Location files this sitting may deepen: [[location-N-slug]]
- Sprint grouping this sitting names: [[week-1]]
- Slices a planning sitting will freeze (not written from this file): [[slice-N-slug]]
- Prior sitting, if this resumes a parked grill: [[rounds-NN-slug]]

## See also
- Durable docs the sitting pointed at: `docs/...`
```

The h1 `Title` string must match the string of the `title` frontmatter field.

**Required sections (advisory, i2):** the kind registry records `Round 1` and
`Confirm` as the required body sections for a `round`. They are scaffolded
on create and reported by `doctor`/`lint` when missing — a SOFT advisory, never a
write-time error. The remaining headings above are recommended but optional.
Overridable per project via `[kinds.round] required-sections = [...]` in
`config.toml`.
