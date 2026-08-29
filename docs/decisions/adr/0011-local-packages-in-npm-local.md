---
id: "adr-11"
title: "ADR-0011: local first-party packages in dest npm/local"
kind: adr
description: "First-party packages use local: and land at .pi/npm/local/@agentic-core/<name> so Pi npm install cannot wipe them."
status: accepted
domain: pack
area: decisions
tags: [installer, packages]
created_at: "2026-08-30"
updated_at: "2026-08-30"
---

# ADR-0011: local first-party packages in dest npm/local

## Context

[[0010-local-packages-in-npm]] copied first-party packages into `.pi/npm/node_modules/@agentic-core/<name>` and wrote dest-relative `npm/node_modules/` settings. Pi already owns `.pi/npm/node_modules`. When Pi runs npm install for project packages, it rebuilds that tree and deletes the installer copies. Dest then loads missing extensions.

Profile YAML already names the source as `local:@agentic-core/<name>`. That source is not an npm registry install. It is a dest-relative folder Pi should leave alone.

## Decision

Shipped profiles still list first-party packages as `local:@agentic-core/<name>`. Unknown first-party names fail at profile load. `vendor:` and `vendor/` sources fail at profile load.

Install copies `package.json` and non-test `.ts` files into `.pi/npm/local/@agentic-core/<name>`. Dest settings name that dest-relative path. Settings do not list `npm:@agentic-core/<name>`. `--extension` writes the same dest local path.

`canonicalizePackageSource` rewrites leftover `vendor/@agentic-core/<name>`, `.pi/vendor/@agentic-core/<name>`, and `npm/node_modules/@agentic-core/<name>` to `npm/local/@agentic-core/<name>`. Writing a local copy also deletes the old node_modules folder for that name. Parked first-party dest copies still go away.

This checkout's Pi stays unwired to `packages/`. There is no npm publish. There is no `git:` first-party source.

## Alternatives considered

Keep copies in `.pi/npm/node_modules/` and reinstall after every Pi npm install. Dest would keep breaking between installs.

Write settings as `npm:@agentic-core/<name>`. That is a registry source. These packages are not published.

Leave a live path from dest settings to this checkout. Dest would break when the checkout moves.

Put copies outside `.pi/npm/`. Settings already use dest-relative paths under `.pi/`. Staying under `.pi/npm/local/` keeps them next to Pi's package tree without living in `node_modules`.

## Consequences

Pi can install third-party `npm:` packages into `.pi/npm/node_modules/` without deleting first-party copies. Reinstall overwrites `.pi/npm/local/`. Extra dest files survive. Old vendor trees and leftover node_modules first-party copies owned by the installer go away.

## Relationships

- [[0010-local-packages-in-npm]]
- [[0002-standalone-vendor-install]]
- [[architecture-pack-and-packages]]
- [[schema-profile]]
- [[spec-installer]]
- [[guides-install-from-this-repo]]
- [[glossary]]
