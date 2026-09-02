---
title: Concept art under docs world tree
impact: HIGH
impactDescription: design SoT location
tags: [pipeline, concept]
---

## Concept art under docs world tree

Concepts live under design folders, not mesh roots (except optional overflow).

**Incorrect:** `assets/environment/scarecrow/concept.jpg` as only design home; provider dump names `grok-abc.png`.

**Correct:** `docs/reference/world/environment/<category>/<id>/concept_art/<id>-hero-01.jpg`. Rename dumps on save. Mesh `previews/` is for post-export thumbs only.
