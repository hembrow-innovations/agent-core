---
id: "architecture-pack-and-packages"
title: "Pack and packages"
kind: architecture
description: "Four trees keep the markdown pack, workspace packages, dest copy, and first-party npm copies apart."
domain: pack
area: architecture
tags: [architecture]
created_at: "2026-08-23"
updated_at: "2026-08-27"
---

# Pack and packages

## Overview

This repo is a pnpm workspace. It is the only place you install from. A dest project never depends on this checkout at runtime. The installer copies a self-contained tree the dest can commit.

The source pack is this checkout's agent, skill, playbook, and prompt libraries, plus the Pi runtime pack and profiles. `scripts/` holds the checks. The installer package owns profile parse and dest writes. Workspace packages are the TypeScript products under `packages/`. The dest tree is the copied project layout after install. First-party packages land under `.pi/npm/node_modules/@agentic-core/`.

See [[glossary]] for the names used here.

## Context

The old installer copied a profile into a dest tree. For harness pi it copied `pi/extensions/*.ts` into `.pi/extensions/` and merged package sources into `.pi/settings.json`. Third-party tools already arrive as Pi packages such as `npm:pi-lens`. First-party extensions were loose TypeScript files that shared `pi/lib/`.

That mix left dest coupled to loose files. It also left a sibling lib that dest should not own.

The settled layout keeps the markdown pack. It moves first-party extensions into workspace packages. Dest receives a local copy under `.pi/npm/node_modules/`. Dest has no live path back to this checkout.

[[0001-pnpm-workspace-pi-packages]], [[0002-standalone-vendor-install]], [[0010-local-packages-in-npm]], [[0004-source-pack-under-ai]], [[0005-pi-only-dest]], [[0006-source-libraries-beside-pi-runtime]], and [[0008-todo-owns-checklist-store]] record those choices.

## Design

### Source pack

The source pack stays in this checkout, under `ai/`. Skills do not become packages. `profiles/` and `scripts/` stay at the checkout root.

The folders are:

- `ai/agents/` is the agent library.
- `ai/skills/` is the skill library.
- `ai/playbooks/` is the playbook library.
- `ai/prompts/` is the prompt/command library.
- `ai/pi/` is the Pi runtime pack. Prompts, skills, agents, and roles do not live here. It has no `extensions/` and no `lib/`.
- `profiles/` is the install profiles.
- `scripts/` is the checks. Profile parse lives in `packages/installer`.

Leftover empty stub dirs under `ai/` are not libraries.

Skills, prompts, and third-party `npm:pi-lens` sources still copy into dest `.pi/`. Playbooks stay in the source library. Install does not copy them.

### Workspace packages

Product code lives under `packages/`. Folder names stay unscoped. Package names are scoped.

The folders are:

- `packages/draconic-todo` is `@agentic-core/draconic-todo`.
- `packages/draconic-coms` is `@agentic-core/draconic-coms`.
- `packages/draconic-boot` is `@agentic-core/draconic-boot`.
- `packages/draconic-teams` is `@agentic-core/draconic-teams`.
- `packages/draconic-footer` is `@agentic-core/draconic-footer`.
- `packages/installer` is the install CLI.

Protocol code lives inside the coms package. `draconic-coms-protocol` is not a product extension. See [[architecture-draconic-coms]].

Session checklist persistence lives in the todo package. There is no `packages/lib`. See [[architecture-draconic-todo]].

The TUI paints one footer line from the footer package. See [[architecture-draconic-footer]].

There is no npm publish. There is no git package source.

### Dest tree

The dest tree is what a target project commits after install. It holds the copied agents, skills, and prompts under `.pi/`. Identity dest is only `.pi/agents/`. There is no dest roles tree. This repo's `.pi/` is a gitignored dest. It is not the source of truth.

A dest project never depends on this checkout at runtime.

### Local first-party copy

Each first-party extension lands as a copied package at `.pi/npm/node_modules/@agentic-core/<name>`. Settings gain a dest-relative path to that folder. Settings do not list `npm:@agentic-core/<name>`. Re-running install overwrites the copy. Dest extras stay. A dest rewrite removes only installer-owned `.pi/vendor/@agentic-core` trees.

The copy writes `package.json` and non-test `.ts` files from `packages/<name>/src` into that npm tree. First-party extensions do not copy from `pi/extensions/`. That folder is not part of the pack.

```ts
// packages/installer/src/extensions.ts writeVendorExtension
const srcPkg = join(srcRoot, "packages", name);
const destRel = join(".pi", "npm", "node_modules", "@agentic-core", name);
dest.copyFile(join(srcPkg, "package.json"), join(destRel, "package.json"));
copyTsSources(join(srcPkg, "src"), dest, join(destRel, "src"));
```

### Installer CLI

The command is `pnpm exec agentic-core install`. The package lives in `packages/installer`.

- **cli.ts**: parses argv and dispatches
- **profile.ts**: reads `profiles/*.yaml` into a `Profile`
- **dest.ts**: dest `.pi/` reads and writes
- **pack-walk.ts**: `walkSkillDirs` finds `SKILL.md` folders under `ai/skills/`
- **skills.ts**, **playbooks.ts**, **agents.ts**, **prompts.ts**, **extensions.ts**, **runtime.ts**: one module per library or dest write. Playbook catalog rewrite stays in `playbooks.ts`. Install does not call the dest playbook writer.
- **plan.ts**: merges the profile with CLI flags

`installSkills` calls `findSkillDir`, which walks with `walkSkillDirs`. Duplicate basenames prefer `ai/skills/workflow/`, then `ai/skills/setup/`, then the first hit.

```ts
// packages/installer/src/skills.ts findSkillDir
walkSkillDirs(skillsRoot, (dir) => {
  if (basename(dir) === name && existsSync(join(dir, "SKILL.md"))) {
    candidates.push(dir);
  }
});
```

```bash
pnpm exec agentic-core install <target> --profile agentic-core
pnpm exec agentic-core install <target> --extension draconic-todo
```

`--extension` can repeat. Dest is always `.pi/`.

A profile install copies the pack for that profile. It also installs that profile's `packages` list. Profiles `agentic-core` and `life-engine` list the third-party `npm:` sources plus `local:@agentic-core/` packages for todo, coms, boot, teams, and footer.

A leftover `playbooks:` or `mode:` key is an error. Install does not write `.pi/playbooks/`.

An extension install names a first-party package for the dest npm tree.

See [[schema-profile]] for the YAML. See [[spec-installer]] for flags and outputs. See [[guides-install-from-this-repo]] for how to run it.

### This checkout is not auto-wired

This checkout's Pi is not wired to `packages/`. Nothing appears in this checkout's dest until you point the installer at a target. That target may be `.` if you choose.

## Trade-offs

The design optimises for dest independence. Dest can keep a self-contained first-party copy under `.pi/npm/node_modules/`. Re-install is overwrite, not a live link.

It sacrifices a short inner loop that would load `packages/` from this checkout without install. Developers must run the installer against `.` to use the extensions here.

It also refuses a meta package that would install every extension as one unit. Profile `packages` lists stay the grouping mechanism.

This cut has no uninstall.

## Consequences

Install is the only path from workspace packages to a dest. A dest never keeps a live path back to this checkout.

Todo tests and imports stay in the workspace. Dest never sees a sibling lib package.

The pack does not keep `ai/pi/extensions/` or `ai/pi/lib/`. It also does not keep prompts, skills, agents, or roles under `ai/pi/`. Profiles list skills, agents, prompts, packages, and optional settings. They do not name a dest. See [[0005-pi-only-dest]] and [[0006-source-libraries-beside-pi-runtime]].

There is no curl installer. The CLI is `pnpm exec agentic-core install`.

Installer tests write a temp dest and check settings plus the dest npm tree.
