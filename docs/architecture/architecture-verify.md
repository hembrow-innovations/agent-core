---
id: "architecture-verify"
title: "Checks and tests"
kind: architecture
description: "Repo checks and tests live under tests/. scripts/ is only the npm entrypoints."
domain: pack
area: architecture
tags: [architecture, verify]
created_at: "2026-08-30"
updated_at: "2026-09-03"
---

# Checks and tests

## Overview

This checkout verifies itself from two trees. `scripts/` is the npm entrypoints. `tests/` holds repo-level checks, helpers, and tests. Package tests stay next to their source under `packages/`.

See [[architecture-pack-and-packages]] for the pack vs packages split. See [[glossary]] for the names used here.

## Context

Checks used to live under `scripts/checks/`, with a test helper at `scripts/lib/`. That mixed npm entrypoints with verification. Future sessions kept adding checks next to `test.mjs`.

The settled layout is: entrypoints in `scripts/`, verification in `tests/`.

## Design

### scripts/

Root npm scripts each call one `scripts/<name>.mjs` file.

- **test.mjs**: runs package tests, then `tests/` node tests
- **typecheck.mjs**: runs package typecheck

Do not put checks or tests here.

### tests/

Repo verification. Folders:

- **checks/**: standalone integrity scripts. `check-no-pstack.mjs`, `check-ported-skills.mjs`, and `check-hivemind-layout.mjs` (profile dirs, frameworks dest, write-if-missing `.hivemind/hivemind.yaml`). Spawned from `tests/profile/profile.test.mjs`
- **lib/**: test helpers. `profile.mjs` re-exports the installer. Profile parse still lives in `packages/installer`
- **profile/**, **pi/**, **oracle/**: `node --test` files

Add a new repo check under `tests/checks/`. Add a new repo test under `tests/<area>/`. Do not add either under `scripts/`.

### packages/

Workspace package tests stay next to their source as `*.test.ts`. `pnpm test` reaches them through `scripts/test.mjs` via `pnpm -r --filter ./packages/** test`. Parked packages under `deprecated/` are not in that filter.

## Trade-offs

The design optimises for a single place to look when adding or reading verification. It keeps npm scripts short.

It sacrifices keeping a check next to the entrypoint that runs the suite. `scripts/test.mjs` still has to know which `tests/` folders to run.

## Consequences

`AGENTS.md` names this split. A session that needs a repo check edits `tests/`, not `scripts/`.

[[0006-source-libraries-beside-pi-runtime]] still says `scripts/` held the checks. That line is stale. This note is the living layout.
