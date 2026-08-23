---
id: "guides-install-from-this-repo"
title: "Install from this repo"
kind: guide
description: "Install a profile or one-off extension from this checkout into a dest."
domain: pack
area: guides
tags: [guide]
created_at: "2026-08-23"
updated_at: "2026-08-23"
---

# Install from this repo

## Overview

How to install from this checkout into a dest project.
For humans working in this repo.

## Prerequisites

- This repo checked out
- `pnpm install` at the repo root

## Steps

1. Pick a dest directory. Use `.` to install into this checkout.
2. Install a profile.

   `pnpm exec agentic-core install <target> --profile pi`

   That also installs `draconic-todo`, `draconic-coms`, and `draconic-boot`.
3. Or install a one-off extension.

   `pnpm exec agentic-core install <target> --extension draconic-todo`
4. Pass `--harness` to override the profile.

   `pnpm exec agentic-core install <target> --profile pi --harness pi`
5. Commit dest `.pi/vendor/` and the dest settings that point at it.

## Examples

Profile install into this checkout.

```bash
pnpm exec agentic-core install . --profile pi
```

You will see:

- `.pi/vendor/@agentic-core/draconic-todo`
- `.pi/vendor/@agentic-core/draconic-coms`
- `.pi/vendor/@agentic-core/draconic-boot`
- dest-relative paths for those folders in `.pi/settings.json`

One-off extension into another dest.

```bash
pnpm exec agentic-core install ../app --extension draconic-todo
```

You will see `../app/.pi/vendor/@agentic-core/draconic-todo` and a dest-relative path in `../app/.pi/settings.json`.

Re-run the same command to overwrite the vendor copy.

This checkout does not vendor `packages/` until you point the installer at a target.

## Reference

- Command and dest rules in [[spec-installer]]
- Pack layout in [[architecture-pack-and-packages]]
- Decision record in [[adr-2]]
- Terms in [[glossary]]
