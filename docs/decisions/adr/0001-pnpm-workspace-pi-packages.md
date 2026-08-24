---
id: "adr-1"
title: "ADR-0001: pnpm workspace for first-party Pi packages"
kind: adr
description: "First-party TypeScript becomes workspace packages and skills stay markdown."
status: accepted
domain: packages
area: decisions
tags: [pnpm, packages]
created_at: "2026-08-23"
updated_at: "2026-08-24"
---

# ADR-0001: pnpm workspace for first-party Pi packages

## Context

This repo is the only place first-party TypeScript is developed. Dest projects must not depend on this checkout at runtime. First-party extensions are loose TypeScript files that share `pi/lib/`. Pi already understands packages with `package.json` `pi.extensions`, local paths, `npm:`, and `git:`. Skills and playbooks are markdown. They are not runtime TypeScript. The root is npm today. The workspace must become pnpm.

## Decision

TypeScript that we develop and install becomes workspace packages. Skills and playbooks stay markdown files. The workspace packages are:

- `packages/lib`
- `packages/draconic-todo`
- `packages/draconic-coms`
- `packages/draconic-boot`
- `packages/installer`

Package names are scoped. Folders stay unscoped. The name for todo is `@agentic-core/draconic-todo`. Protocol code lives inside the coms package. `draconic-coms-protocol` is not a product extension. Lib stays a source package for imports and tests. There are no skill packages. There is no meta package that installs every extension as one unit. There is no npm publish.

## Alternatives considered

Keep first-party extensions as loose TypeScript under `pi/extensions/`. That keeps shared `pi/lib/` and skips a real package boundary. Pi already has a package model. Loose files fight that model.

Turn skills into npm or Pi packages. Skills are markdown. Packaging them adds no install value and mixes two source kinds.

Add a meta package that installs every extension. Profiles already list extensions. A meta package hides that list and blocks single-extension installs.

Publish to npm. Dest would then depend on a registry. This repo is the only install source.

Keep protocol as its own product extension. Protocol is not an installable product. It belongs inside coms.

## Consequences

Workspace tests and imports can use `@agentic-core/*`. Install can treat each extension as a package with `package.json` `pi.extensions`. `pi/extensions/` and `pi/lib/` go away as source. Profiles stay the unit that groups extensions. Single-extension install stays possible with `--extension`. Publishing is not a release path.

## Relationships

- [[glossary]]
- [[architecture-pack-and-packages]]
- [[spec-installer]]
- [[plan-2-pnpm-pi-packages]]
- [[adr-3]] removes `packages/lib`
