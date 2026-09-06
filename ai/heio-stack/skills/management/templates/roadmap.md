---
id: roadmap
type: doc
kind: roadmap
title: Roadmap
domain: <domain>   # domain the doc concerns, e.g. system
created_at: <iso_date>
updated_at: <iso_date>
---
### Roadmap Model

**Location**: `.heio/planning/`
**Filename**: `roadmap.md`

Locations as destinations, not a schedule. Each bullet is “this is working when.” Add bullets. Do not rewrite siblings to add one. Depth that will not fit a bullet lives on a location file.

#### Frontmatter

_Required frontmatter fields always included_

```yaml
...Required frontmatter fields
title: "Roadmap"
description: "one sentence description"
status: "draft" | "active"
tags: ["list of tags"]
created_at: <iso_date>
updated_at: <iso_date>
```

Status is a 2-state machine enum. `draft` while destinations are still fog. `active` once the live map is the one sittings hang work off.

#### Body / Content

```markdown
# {Title}

Locations. Destinations, not a schedule. Add bullets. Do not rewrite siblings to add one.

## Locations
- **<location>**: <this is working when>
  - bet: try X; pivot if Y
- **<location>**: <this is working when>

A **bet** is an optional sub-bullet: try X; pivot if Y. If it wins, it becomes a location or a sprint grouping.

## Relations
- Intent: [[intent]]
- Location files (only when a bullet needs depth): [[location-N-slug]]
- Current sprint grouping: [[week-1]]
- Sitting that last charted this map: [[rounds-NN-slug]]

## See also
- Durable docs: `docs/...` (ADR, architecture, purpose)
- Archived locations: `.heio/archive/planning/locations/`
```

The h1 `Title` string must match the string of the `title` frontmatter field.

**Required sections (advisory, i2):** the kind registry records `Locations` as
the required body section for a `roadmap`. It is scaffolded on create and
reported by `doctor`/`lint` when missing — a SOFT advisory, never a write-time
error. The remaining headings above are recommended but optional. Overridable
per project via `[kinds.roadmap] required-sections = [...]` in `config.toml`.
