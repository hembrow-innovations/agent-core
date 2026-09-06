---
id: ticket-01-title
type: doc
kind: ticket
title: <ticket_title>
domain: <domain>   # domain the doc concerns, e.g. system
issue-type: <"bug" | "feature-request" | "observation">
created_at: <iso_date>
updated_at: <iso_date>
closed_at: <iso_date> # Optional, added when task is completed

---
### Issue Model

**Location**: `.heio/planning/tickets`
**Filename**: `ticket-<N>-<slug>.md`

#### Frontmatter

_Required frontmatter fields always included_

```yaml
...Required frontmatter fields
title: "issue title"
description: "one sentence description"
status: "open" | "reviewing" | "promoted" | "closed" | "wontfix"
issue-type: "bug" | "feature-request" | "observation"   # optional (i3)
severity: "critical" | "high" | "medium" | "low"          # optional (i4)
tags: ["list of tags"]
created_at: <iso_date>
updated_at: <iso_date>
```

##### `ticket-type` (i3) and `severity` (i4)

Both fields are **optional, closed-vocabulary** triage facets:

- `ticket-type` — the nature of the ticket: `bug` | `feature-request` | `observation`.
  The frontmatter key is `ticket-type`, **not** `type`: the bare `type` key is the
  node-kind discriminator (always `doc`), so the triage type rides on a distinct
  key to avoid the clash.
- `severity` — the impact/urgency: `critical` | `high` | `medium` | `low`. Bugs
  typically carry severity; feature-requests / observations usually do not.

Both are OPTIONAL — an untriaged ticket may carry neither — and validated against
their vocabulary when present (an out-of-vocabulary value is a hard error, like the
other closed-vocab enums). They are set through the unified `ticket set` payload
(`{"ticket-type":"bug","severity":"high"}`), indexed into dedicated `ticket_type` /
`severity` columns, and filterable on the `query` / `ls` surfaces via
`--ticket-type <v>` and `--severity <v>` (mirroring `--status`).

#### Body / Content

```markdown
# {Title}

## Description
Full description of the ticket — what's wrong, missing, intended or needed.

## Affected
What this concerns — areas, components, commands, or flows impacted.

## Observed
Reproduction steps, error output, logs, or unexpected behaviour seen.

## Impact
Why it matters and what's at risk.

## Proposed Fix
Best known approach, or leave blank if unknown.
```

The h1 `Title` string must match the string of the `title` frontmatter field.

**Required sections (advisory, i2):** the kind registry records `Description` and
`Proposed Fix` as the required body sections for a `ticket`. They are scaffolded
on create and reported by `doctor`/`lint` when missing - a SOFT advisory, never a
write-time error. The remaining headings above are recommended but optional.
Overridable per project via `[kinds.ticket] required-sections = [...]` in
`config.toml`.
