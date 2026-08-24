---
id: "architecture-pack-and-packages"
title: "Pack and packages"
kind: architecture
description: "Four trees keep the markdown pack, workspace packages, dest copy, and vendor extensions apart."
domain: pack
area: architecture
tags: [architecture]
created_at: "2026-08-23"
updated_at: "2026-08-24"
---

# Pack and packages

## Overview

This repo is a pnpm workspace. It is the only place you install from. A dest project never depends on this checkout at runtime. The installer copies a self-contained tree the dest can commit.

The source pack is this checkout's markdown library and profiles. Workspace packages are the TypeScript products under `packages/`. The dest tree is the copied project layout after install. The vendor copy is the first-party package under `.pi/vendor/`.

See [[glossary]] for the names used here.

## Context

The old installer copied a profile into a dest tree. For harness pi it copied `pi/extensions/*.ts` into `.pi/extensions/` and merged package sources into `.pi/settings.json`. Third-party tools already arrive as Pi packages such as `npm:pi-lens`. First-party extensions were loose TypeScript files that shared `pi/lib/`.

That mix left dest coupled to loose files. It also left a sibling lib that dest should not own.

The settled layout keeps the markdown pack. It moves first-party extensions into workspace packages. Dest receives a vendor copy. Dest has no live path back to this checkout.

[[adr-1]], [[adr-2]], and [[adr-3]] record those choices.

## Design

### Source pack

The source pack stays in this checkout. Skills do not become packages.

The folders are:

- `skills/` is the markdown skill library.
- `playbooks/` is the playbook library.
- `profiles/` is the install profile list. Pi profiles gain an `extensions` list.
- `pi/` holds prompts, roles, `APPEND_SYSTEM`, and the third-party package list. It has no `extensions/` and no `lib/`.

Skills, playbooks, prompts, roles, and `npm:pi-lens` style sources still copy the way they do today.

### Workspace packages

Product code lives under `packages/`. Folder names stay unscoped. Package names are scoped.

The folders are:

- `packages/draconic-todo` is `@agentic-core/draconic-todo`.
- `packages/draconic-coms` is `@agentic-core/draconic-coms`.
- `packages/draconic-boot` is `@agentic-core/draconic-boot`.
- `packages/installer` is the install CLI.

Protocol code lives inside the coms package. `draconic-coms-protocol` is not a product extension.

Session checklist persistence lives in the todo package. There is no `packages/lib`.

There is no npm publish. There is no git package source.

### Dest tree

The dest tree is what a target project commits after install. It holds the copied skills, playbooks, prompts, roles, and harness files. This repo's `.pi/` is a gitignored dest. It is not the source of truth.

A dest project never depends on this checkout at runtime.

### Vendor copy

Each first-party extension lands as a copied package at `.pi/vendor/@agentic-core/<name>`. Settings gain a dest-relative path to that folder. The target commits `.pi/vendor/` and those settings. Re-running install overwrites the copy.

First-party extensions do not copy from `pi/extensions/`. That folder is not part of the pack.

### Installer CLI

The command is `pnpm exec agentic-core install`.

```bash
pnpm exec agentic-core install <target> --profile pi
pnpm exec agentic-core install <target> --extension draconic-todo
pnpm exec agentic-core install <target> --profile pi --harness pi
```

`--harness` overrides the profile. `--extension` can repeat.

A profile install copies the pack for that profile. It also installs that profile's `extensions` list. Pi profiles `pi`, `agentic-core`, and `life-engine-pi` all list `draconic-todo`, `draconic-coms`, and `draconic-boot`.

An extension install names a first-party package for the vendor tree. Vendor write happens only when the dest harness is `pi`.

See [[spec-installer]] for flags and outputs. See [[guides-install-from-this-repo]] for how to run it.

### This checkout is not auto-wired

This checkout's Pi is not wired to `packages/`. Nothing appears in this checkout's dest until you point the installer at a target. That target may be `.` if you choose.

## Trade-offs

The design optimises for dest independence. Dest can commit a self-contained vendor tree. Re-install is overwrite, not a live link.

It sacrifices a short inner loop that would load `packages/` from this checkout without install. Developers must run the installer against `.` to use the extensions here.

It also refuses a meta package that would install every extension as one unit. Profile `extensions` lists stay the grouping mechanism.

This cut has no uninstall.

## Consequences

Install is the only path from workspace packages to a dest. A dest never keeps a live path back to this checkout.

Todo tests and imports stay in the workspace. Dest never sees a sibling lib package.

The pack does not keep `pi/extensions/` or `pi/lib/`. Profiles keep their current language. They add an `extensions` list on Pi profiles.

There is no curl installer. The CLI is `pnpm exec agentic-core install`.

Installer tests write a temp dest and check settings plus the vendor tree.
