---
id: "guides-install-from-this-repo"
title: "Install from this repo"
kind: guide
description: "Install a profile from this checkout into a dest .opencode/ tree."
domain: pack
area: guides
tags: [guide]
created_at: "2026-08-23"
updated_at: "2026-09-06"
---

# Install from this repo

## Overview

How to install from this checkout into a dest project.
For humans working in this repo.
Dest is always `.opencode/`.

## Prerequisites

- This repo checked out
- `pnpm install` at the repo root
- The target directory already exists

The CLI dies unless it can see `profiles/`, `ai/skills/`, and `stacks/` from this checkout.

```ts
// packages/installer/src/cli.ts — repoRoot
const root = resolve(here, "../../..");
if (
  !existsSync(join(root, "profiles")) ||
  !existsSync(join(root, "ai", "skills")) ||
  !existsSync(join(root, "stacks"))
) {
  die("agentic-core must run from this checkout");
}
```

## Steps

1. Pick a dest directory. Use `.` to install into this checkout.
2. Install a profile.

   `pnpm exec agentic-core install <target> --profile agentic-core`

   Omit `--profile` and the CLI still uses `agentic-core`.
3. Add or drop skills on that profile if you need to.

   `pnpm exec agentic-core install <target> --profile agentic-core --with godot-mono`
4. Restart OpenCode so it loads the dest files.

The installer does not copy playbooks. Full flag rules are in [[spec-installer]].

## Examples

Profile install into this checkout.

```bash
pnpm exec agentic-core install . --profile agentic-core
```

You will see:

- selected skills under `.opencode/skills/`
- agents under `.opencode/agents/`
- prompts under `.opencode/commands/`

You will not see `.pi/`, first-party npm copies, or `APPEND_SYSTEM.md`.

Re-run the same command to overwrite listed dest files. Extra dest files stay. Installer-owned leftover `.pi/` trees go away.

## Reference

- Profile YAML in [[schema-profile]]
- Command and dest rules in [[spec-installer]]
- Pack layout in [[architecture-pack-and-packages]]
- Decision record in [[0021-opencode-only-dest]] and [[0016-profiles-are-directories]]
- Terms in [[glossary]]
