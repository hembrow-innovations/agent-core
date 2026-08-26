---
id: "adr-10"
title: "ADR-0010: local first-party packages in dest npm/node_modules"
kind: adr
description: "First-party packages use local: and land at .pi/npm/node_modules/@agentic-core/<name>."
status: accepted
domain: pack
area: decisions
tags: [installer, packages]
created_at: "2026-08-27"
updated_at: "2026-08-27"
---

# ADR-0010: local first-party packages in dest npm/node_modules

## Context

Dest still must not depend on this checkout at runtime. [[0002-standalone-vendor-install]] put first-party copies under `.pi/vendor/@agentic-core/<name>` and wrote dest-relative `vendor/` settings. Pi already installs project packages into `.pi/npm/`. A second first-party tree fought that layout. `vendor:` and `vendor/` sources also looked like a publish path they are not.

## Decision

Shipped profiles list first-party packages as `local:@agentic-core/<name>`. Unknown first-party names fail at profile load. `vendor:` and `vendor/` sources fail at profile load.

Install copies `package.json` and non-test `.ts` files into `.pi/npm/node_modules/@agentic-core/<name>`. Dest settings name that dest-relative path. Settings do not list `npm:@agentic-core/<name>`. `--extension` writes the same dest npm path.

Dest install creates and updates. It never prunes extra dest skills, agents, playbooks, prompts, or settings packages. A dest rewrite removes only installer-owned `.pi/vendor/@agentic-core` trees. Other dest extras stay. Leftover `vendor/@agentic-core/...` settings drop when the npm path is present.

This checkout's Pi stays unwired to `packages/`. There is no npm publish. There is no `git:` first-party source.

## Alternatives considered

Keep `.pi/vendor/` as the first-party dest. Dest would keep a second tree next to Pi's `.pi/npm/` install root.

Write settings as `npm:@agentic-core/<name>`. That is a registry source. These packages are not published.

Leave a live path from dest settings to this checkout. Dest would break when the checkout moves.

## Consequences

Dest first-party copies sit where Pi already looks for local packages. Profiles name the source with `local:`. Reinstall overwrites the copy. Extra dest files survive. Old vendor trees owned by the installer go away.

## Relationships

- [[0002-standalone-vendor-install]]
- [[0008-todo-owns-checklist-store]]
- [[architecture-pack-and-packages]]
- [[schema-profile]]
- [[spec-installer]]
- [[guides-install-from-this-repo]]
- [[glossary]]
