---
id: "adr-3"
title: "ADR-0003: checklist store lives in the todo package"
kind: adr
description: "Session checklist persistence belongs to @agentic-core/draconic-todo. There is no packages/lib."
status: accepted
domain: packages
area: decisions
tags: [packages, installer]
created_at: "2026-08-24"
updated_at: "2026-08-24"
---

# ADR-0003: checklist store lives in the todo package

## Context

`packages/lib` existed so the installer could copy shared helpers into each dest vendor package. The only consumer was `@agentic-core/draconic-todo`. Dest still needed a self-contained vendor copy with no live path back to this checkout.

## Decision

Session checklist persistence lives in `packages/draconic-todo`. The installer copies that package as it is. There is no `packages/lib`. Dest still has no sibling lib package.

## Alternatives considered

Keep `packages/lib` for later shared code. An empty package has no consumer. Add a package when a second caller exists.

Keep the installer lib-bundle rewrite. That path only existed because the store sat in a sibling package.

## Consequences

Todo tests sit next to the store. Dest vendor `src/` matches the source package. The installer no longer rewrites `@agentic-core/lib` imports.

## Relationships

- [[adr-1]]
- [[adr-2]]
- [[glossary]]
- [[architecture-pack-and-packages]]
- [[spec-installer]]
