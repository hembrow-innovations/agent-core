---
id: "adr-8"
title: "ADR-0008: checklist store lives in the todo package"
kind: adr
description: "Session checklist persistence belongs to @agentic-core/heio-todo. There is no packages/lib."
status: superseded
domain: packages
area: decisions
tags: [packages, installer]
created_at: "2026-08-25"
updated_at: "2026-08-31"
---

# ADR-0008: checklist store lives in the todo package

Superseded by [[0012-inobit-pi-todo]]. First-party `heio-todo` is parked. Session todos are pinned `@inobit/pi-todo`. There is still no `packages/lib`.

## Context

`packages/lib` existed so the installer could copy shared helpers into each dest vendor package. The only consumer was `@agentic-core/heio-todo`. Dest still needed a self-contained vendor copy with no live path back to this checkout.

## Decision

Session checklist persistence lives in `packages/heio-todo`. The installer copies that package as it is. There is no `packages/lib`. Dest still has no sibling lib package.

## Alternatives considered

Keep `packages/lib` for later shared code. An empty package has no consumer. Add a package when a second caller exists.

Keep the installer lib-bundle rewrite. That path only existed because the store sat in a sibling package.

## Consequences

Todo tests sit next to the store. Dest vendor `src/` matches the source package. The installer no longer rewrites `@agentic-core/lib` imports.

## Relationships

- [[0001-pnpm-workspace-pi-packages]]
- [[0002-standalone-vendor-install]]
- [[glossary]]
- [[architecture-pack-and-packages]]
- [[architecture-heio-todo]]
- [[spec-installer]]
