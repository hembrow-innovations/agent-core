---
id: "architecture-pack-and-packages"
title: "Pack and packages"
kind: architecture
description: "Source pack, installer package, and dest .opencode/ copy stay apart."
domain: pack
area: architecture
tags: [architecture]
created_at: "2026-08-23"
updated_at: "2026-09-06"
---

# Pack and packages

## Overview

This repo is a pnpm workspace. It is the only place you install from. A dest project never depends on this checkout at runtime. The installer copies a self-contained tree the dest can commit.

The source pack is this checkout's agent, skill, playbook, and prompt libraries, plus profiles. `tests/` holds the checks and repo tests. `scripts/` is the npm entrypoints. The installer package owns profile parse and dest writes. The dest tree is the copied project layout after install.

See [[glossary]] for the names used here.

## Context

The old installer copied a profile into dest `.pi/` and merged Pi packages into `.pi/settings.json`. First-party Pi plugins landed under `.pi/npm/local/`.

This repo is now only a profile installer. Dest is OpenCode. Pi runtime and plugins are parked under `deprecated/`.

[[0004-source-pack-under-ai]], [[0021-opencode-only-dest]], and [[0006-source-libraries-beside-pi-runtime]] record those choices.

## Design

### Source pack

The source pack stays in this checkout, under `ai/`. Skills do not become packages. `profiles/`, `scripts/`, and `tests/` stay at the checkout root.

The folders are:

- `ai/agents/` is the agent library.
- `ai/skills/` is the skill library.
- `ai/playbooks/` is the playbook library. Install does not copy it.
- `ai/prompts/` is the prompt/command library. Category folders like `ai/skills/`. Overlay dest is `.opencode/commands/<id>.md`.
- `ai/system-prompts/` is parked Pi runtime markdown. Install does not copy it.
- `profiles/` is the install profiles. Each profile is `profiles/<name>/profile.yaml`. See [[0016-profiles-are-directories]].
- `scripts/` is the npm entrypoints. Profile parse lives in `packages/installer`.
- `tests/` is the repo checks and tests. See [[architecture-verify]].

Leftover empty stub dirs under `ai/` are not libraries.

### Workspace packages

The only workspace package is `packages/installer`, the install CLI.

Parked Pi plugins live under `deprecated/packages/`. They are not workspace packages and no profile installs them.

There is no npm publish. There is no git package source.

### Dest tree

The dest tree is what a target project commits after install. It holds the copied agents, skills, and commands under `.opencode/`. This repo's `.opencode/` is a gitignored dest. It is not the source of truth.

A dest project never depends on this checkout at runtime.

### Installer CLI

The command is `pnpm exec agentic-core install`. The package lives in `packages/installer`.

- **cli.ts**: parses argv and dispatches
- **profile.ts**: reads `profiles/<name>/profile.yaml` into a `Profile`
- **dest.ts**: dest `.opencode/` reads and writes
- **pack-walk.ts**: `walkSkillDirs` finds `SKILL.md` folders under `ai/skills/`. `walkPromptFiles` finds prompt markdown under `ai/prompts/`
- **skills.ts**, **playbooks.ts**, **agents.ts**, **prompts.ts**: one module per library. Playbook catalog rewrite stays in `playbooks.ts`. Install does not call the dest playbook writer.
- **plan.ts**: merges the profile with CLI flags

```bash
pnpm exec agentic-core install <target> --profile agentic-core
```

Dest is always `.opencode/`.

A leftover `playbooks:`, `packages:`, `settings:`, or `system-prompt:` key is an error. Install does not write `.opencode/playbooks/`.

See [[schema-profile]] for the YAML. See [[spec-installer]] for flags and outputs. See [[guides-install-from-this-repo]] for how to run it.

### This checkout is not auto-wired

Nothing appears in this checkout's dest until you point the installer at a target. That target may be `.` if you choose.

## Trade-offs

The design optimises for dest independence. Re-install is overwrite, not a live link.

This cut has no uninstall.

## Consequences

Install is the only path from the source pack to a dest. A dest never keeps a live path back to this checkout.

Profiles list skills, agents, and prompts. They do not name a dest. See [[0021-opencode-only-dest]], [[0006-source-libraries-beside-pi-runtime]], [[0016-profiles-are-directories]], [[0019-hivemind-own-repo]], and [[schema-profile]].

There is no curl installer. The CLI is `pnpm exec agentic-core install`.
