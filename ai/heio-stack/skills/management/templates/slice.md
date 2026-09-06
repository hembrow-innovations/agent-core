---
id: slice-N-slug
type: doc
kind: slice
title: <slice_title>
domain: <domain>   # domain the doc concerns, e.g. system
sprint: <sprint_name>
created_at: <iso_date>
updated_at: <iso_date>
met_at: <iso_date> # Optional, added when the slice is met
---
### Slice Model

**Location**: `.heio/planning/sprints/<sprint_name>/slices/`
**Filename**: `slice-<N>-<slug>.md`

A vertical cut that is usable or learnable on its own. Not a layer. One markdown file: status, oracle checklist, durable links to task ids. There is no slice folder and no separate spec / oracles / tasks file. A slice you cannot demo or learn from in one sitting is two slices.

#### Frontmatter

_Required frontmatter fields always included_

```yaml
...Required frontmatter fields
title: "slice title"
description: "one sentence description"
status: "shaping" | "frozen" | "active" | "met" | "abandoned"
sprint: "week-1"
tags: ["list of tags"]
created_at: <iso_date>
updated_at: <iso_date>
```

Status is a 5-state machine enum:

- `shaping` — Done and `EXPECT:` are still forming
- `frozen` — Done and `EXPECT:` exist; the sitting publishes task files and Pool `[[id]]` links in the same pass
- `active` — linked task work is in progress; many slices may be `active`
- `met` — every linked task id is `complete` and the oracles hold. Links are never dropped
- `abandoned` — leftover oracles have `ABANDON:` with a named home (ticket id or “drop from sprint”)

`sprint` names the grouping folder. It is required so the slice can be found from a task or ticket without walking the tree.

#### Body / Content

```markdown
# {Title}

## Why
The outcome this vertical cut exists to produce. Usable or learnable on its own.

## Done
In words. Then write oracles immediately. If you cannot write a `CHECK:` / `EXPECT:`, this section is still mush.

## Blocked by
None. Or `[[slice-N-slug]]`: why this slice waits. Unblocked slices may run in parallel.

## Non-goals
What this slice will not absorb. Incoming product work that lands here is a ticket.

## Oracle checklist
- [ ] O1: <user-visible or contract outcome>
  CHECK: <command>
  EXPECT: <success-only token>
  EVIDENCE: pending

`EXPECT:` freezes with the slice. `CHECK:` may be refined so the command stays runnable. `EVIDENCE:` records what the check showed. Abandon with `ABANDON: <reason> → <ticket-id or "drop from sprint">`.

## Pool
Durable links to task ids. Never drop them.

- `[[tasks-N-slug]]`

## Relations
- Sprint grouping: [[week-1]]
- Blocked by slices: [[slice-N-slug]]
- Tasks this slice owns: [[tasks-N-slug]]
- Tickets promoted into this slice: [[ticket-N-slug]]
- Location this cut serves: [[location-N-slug]]

## See also
- Durable docs: `docs/...` (ADR, spec, contract)
- Paths a stranger would otherwise hunt
```

The h1 `Title` string must match the string of the `title` frontmatter field.

**Required sections (advisory, i2):** the kind registry records `Why`, `Done`,
`Oracle checklist`, and `Pool` as the required body sections for a `slice`. They
are scaffolded on create and reported by `doctor`/`lint` when missing — a SOFT
advisory, never a write-time error. The remaining headings above are recommended
but optional. Overridable per project via
`[kinds.slice] required-sections = [...]` in `config.toml`.
