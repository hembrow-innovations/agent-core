---
id: "guides-install-from-this-repo"
title: "Install from this repo"
kind: guide
description: "Install a profile or one-off extension from this checkout into a dest."
domain: pack
area: guides
tags: [guide]
created_at: "2026-08-23"
updated_at: "2026-08-26"
---

# Install from this repo

## Overview

How to install from this checkout into a dest project.
For humans working in this repo.
Dest is always `.pi/`.

## Prerequisites

- This repo checked out
- `pnpm install` at the repo root
- The target directory already exists

The CLI dies unless it can see `profiles/` and `ai/skills/` from this checkout.

```ts
// packages/installer/src/cli.ts — repoRoot
const root = resolve(here, "../../..");
if (
  !existsSync(join(root, "profiles")) ||
  !existsSync(join(root, "ai", "skills"))
) {
  die("agentic-core must run from this checkout");
}
```

## Steps

1. Pick a dest directory. Use `.` to install into this checkout.
2. Install a profile.

   `pnpm exec agentic-core install <target> --profile agentic-core`

   That also installs `draconic-todo`, `draconic-coms`, `draconic-boot`, `draconic-teams`, and `draconic-footer`.
   Omit `--profile` and the CLI still uses `agentic-core`, unless you pass only `--extension`.
3. Add or drop skills on that profile if you need to.

   `pnpm exec agentic-core install <target> --profile agentic-core --with godot-mono`
4. Or install a one-off extension and skip the profile.

   `pnpm exec agentic-core install <target> --extension draconic-todo`
5. Commit dest `.pi/vendor/` and the dest settings that point at it.

Playbook selection flags are `--playbooks`, `--with-playbooks`, and `--without-playbooks`. Full flag rules are in [[spec-installer]].

## Examples

Profile install into this checkout.

```bash
pnpm exec agentic-core install . --profile agentic-core
```

You will see:

- `.pi/vendor/@agentic-core/draconic-todo`
- `.pi/vendor/@agentic-core/draconic-coms`
- `.pi/vendor/@agentic-core/draconic-boot`
- `.pi/vendor/@agentic-core/draconic-teams`
- `.pi/vendor/@agentic-core/draconic-footer`
- dest-relative paths for those folders in `.pi/settings.json`
- selected skills under `.pi/skills/`
- playbooks, agents, and prompts from the YAML `all` keys

One-off extension into another dest.

```bash
pnpm exec agentic-core install ../app --extension draconic-todo
```

You will see `../app/.pi/vendor/@agentic-core/draconic-todo` and a dest-relative path in `../app/.pi/settings.json`. You will not see `.pi/skills`.

Re-run the same command to overwrite the vendor copy.

This checkout does not vendor `packages/` until you point the installer at a target.

## Reference

- Profile YAML in [[schema-profile]]
- Command and dest rules in [[spec-installer]]
- Pack layout in [[architecture-pack-and-packages]]
- Decision record in [[0002-standalone-vendor-install]] and [[0005-pi-only-dest]]
- Terms in [[glossary]]
