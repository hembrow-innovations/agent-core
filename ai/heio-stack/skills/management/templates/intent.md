---
id: intent
type: doc
kind: intent
title: Intent
domain: <domain>   # domain the doc concerns, e.g. system
created_at: <iso_date>
updated_at: <iso_date>
superseded_at: <iso_date> # Optional, added when intent is superseded
---
### Intent Model

**Location**: `.heio/planning/`
**Filename**: `intent.md`

One page. Why the project exists, what success looks like, what is held out on purpose. Sticky. Change rarely, and only on purpose. The destination behind the locations.

#### Frontmatter

_Required frontmatter fields always included_

```yaml
...Required frontmatter fields
title: "Intent"
description: "one sentence description"
status: "active" | "superseded"
tags: ["list of tags"]
created_at: <iso_date>
updated_at: <iso_date>
```

Status is a 2-state machine enum. `active` is the live destination. `superseded` means a later intent replaced it — keep the file, point at the replacement, do not rewrite history in place.

#### Body / Content

```markdown
# {Title}

## Why this project exists
One page. The destination behind the locations. Not a feature list.

## Success looks like
X. Observable. A stranger could tell without reading the backlog.

## We will not
Y. Non-goals held on purpose. Incoming work that lands here is a ticket or an escalate, not a quiet rewrite.

## Relations
- Roadmap: [[roadmap]]
- Location files: [[location-N-slug]]
- Current grouping: [[week-1]]
- Replacement intent (if superseded): [[intent]]

## See also
- Durable docs: `docs/...` (ADR, purpose, architecture)
- Round that last confirmed this sitting: [[rounds-NN-slug]]
```

The h1 `Title` string must match the string of the `title` frontmatter field.

**Required sections (advisory, i2):** the kind registry records `Why this project exists` and
`Success looks like` as the required body sections for an `intent`. They are
scaffolded on create and reported by `doctor`/`lint` when missing — a SOFT
advisory, never a write-time error. The remaining headings above are recommended
but optional. Overridable per project via
`[kinds.intent] required-sections = [...]` in `config.toml`.
