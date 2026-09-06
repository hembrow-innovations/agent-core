---
id: location-N-slug
type: doc
kind: location
title: <location_title>
domain: <domain>   # domain the doc concerns, e.g. system
created_at: <iso_date>
updated_at: <iso_date>
done_at: <iso_date> # Optional, added when the location is done
---
### Location Model

**Location**: `.heio/planning/locations/`
**Filename**: `location-<N>-<slug>.md`

Extra depth for one roadmap bullet. Same shape as the bullet: short why, nested location bullets, optional bets, enough links. No nested folders. Only write this file when the roadmap line is not enough.

#### Frontmatter

_Required frontmatter fields always included_

```yaml
...Required frontmatter fields
title: "location title"
description: "one sentence description"
status: "active" | "done"
tags: ["list of tags"]
created_at: <iso_date>
updated_at: <iso_date>
```

Status is a 2-state machine enum. `active` is a live destination. `done` means the observable held — move the file under `.heio/archive/planning/locations/` and leave the bullet off the live roadmap.

#### Body / Content

```markdown
# {Title}

## This is working when
Observable. A stranger could tell. The same grain as the roadmap bullet this file deepens.

## Nested locations
- **<child>**: <this is working when>
  - bet: try X; pivot if Y

## Relations
- Roadmap: [[roadmap]]
- Intent: [[intent]]
- Parent location (if this is a nested destination): [[location-N-slug]]
- Sprint named after this location: [[week-1]]
- Slices that cut this destination: [[slice-N-slug]]

## See also
- Durable docs: `docs/...` (ADR, spec, architecture)
- Paths a stranger would otherwise hunt
```

The h1 `Title` string must match the string of the `title` frontmatter field.

**Required sections (advisory, i2):** the kind registry records `This is working when` as
the required body section for a `location`. It is scaffolded on create and
reported by `doctor`/`lint` when missing — a SOFT advisory, never a write-time
error. The remaining headings above are recommended but optional. Overridable
per project via `[kinds.location] required-sections = [...]` in `config.toml`.
