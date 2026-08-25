---
id: "adr-2"
title: "ADR-0002: dest vendor copy with lib bundled"
kind: adr
description: "The installer copies a lib-bundled extension into dest vendor and writes a dest-relative packages path."
status: accepted
domain: pack
area: decisions
tags: [installer, vendor]
created_at: "2026-08-23"
updated_at: "2026-08-23"
---

# ADR-0002: dest vendor copy with lib bundled

## Context

A dest project never depends on this checkout at runtime. Install time bundles lib into each extension. Dest has no sibling lib package. Pi already accepts local package paths in settings. This checkout's `.pi/` is a gitignored dest. Auto-wiring workspace packages into this checkout would create a live path. npm, git, and curl would also leave dest tied to an external source.

## Decision

The installer copies a lib-bundled extension into dest `.pi/vendor/@agentic-core/<name>`. It writes a dest-relative packages path. Dest commits `.pi/vendor/` and those settings. Re-running install overwrites the copy. The path is not a live path to this checkout. The source is not npm. The source is not git. There is no curl installer. This checkout's Pi stays unwired to `packages/`. Nothing appears there until the installer is pointed at a target, including `.` if chosen.

The install command is `pnpm exec agentic-core install <target>`. `--profile` selects a profile. `--extension` can repeat. `--harness` overrides the profile. A profile install also installs that profile's `extensions` list.

Skills, playbooks, prompts, roles, and `npm:pi-lens` style sources still copy the way they do today. First-party extensions do not copy from `pi/extensions/`.

## Alternatives considered

Leave a live path from dest settings to this checkout. Dest would break when the checkout moves. It would also load unbundled workspace sources.

Publish to npm and install from the registry. Dest would need network and a published version. This repo is the only install source.

Use `git:` as the first-party source. Dest would clone or fetch this repo. That is a live dependency on the checkout history.

Keep `curl | node scripts/install.mjs`. That bypasses the workspace command and is not a dest vendor copy.

Auto-wire this checkout's Pi to `packages/`. That makes the repo dest depend on workspace paths. This checkout stays unwired until install runs against a target.

Copy lib into dest as a sibling package. Dest would then have two packages to keep in sync. Bundling lib into each extension keeps dest self-contained.

## Consequences

Dest can commit a self-contained vendor tree. Settings point only at dest-relative paths. This checkout can stay a workspace without being a runtime for its own Pi. Reinstall replaces vendor. There is no uninstall in this cut. First-party extensions no longer live as loose files under dest `.pi/extensions/`.

## Relationships

- [[glossary]]
- [[architecture-pack-and-packages]]
- [[spec-installer]]
- [[guides-install-from-this-repo]]
- [[plan-2-pnpm-pi-packages]]
- [[0008-todo-owns-checklist-store]] drops the lib bundle. Dest vendor is a package copy.
