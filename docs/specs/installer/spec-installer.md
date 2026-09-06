---
id: "spec-installer"
title: "Installer spec"
kind: spec
description: "CLI and dest write rules for install from this repo into .opencode/."
status: draft
domain: pack
area: installer
tags: [spec]
created_at: "2026-08-23"
updated_at: "2026-09-06"
---

# Installer spec

## Goal

Define how `pnpm exec agentic-core install` copies a self-contained tree into a dest.

## Requirements

The command is `pnpm exec agentic-core install <target>`.

`parseArgs` in `packages/installer/src/cli.ts` accepts:

- **`--profile`**: load `profiles/<name>/profile.yaml`
- **`--with`**: comma-separated skill folder names to add
- **`--without`**: comma-separated skill folder names to drop
- **`-h`, `--help`**: print usage

Dest pack is always `.opencode/`.

Agents, skills, and prompts overlay the way they do today.
Dest extras stay. Overlay writers update listed files and do not prune other dest markdown.
The installer does not select or copy playbooks. An existing dest `.opencode/playbooks/` survives reinstall.

This checkout is the only install source.
A dest never depends on this checkout at runtime.

## Non-goals

- Uninstall
- npm publish
- First-party Pi plugins
- A curl entry such as `curl | node scripts/install.mjs`
- A dest other than `.opencode/`
- A profile key that names a dest

## Behaviour

`<target>` is a dest directory. `.` is allowed. `parseArgs` dies on a missing target. `run` dies if the target path does not exist.

`repoRoot` walks three directories up from `cli.ts` and dies unless `profiles/`, `ai/skills/`, and `stacks/` exist. The CLI must run from this checkout.

```ts
// packages/installer/src/cli.ts — parseArgs
else if (a === "--profile") out.profile = need(args, a);
else if (a === "--with") out.with.push(...csv(need(args, a)));
else if (a === "--without") out.without.push(...csv(need(args, a)));
```

`--harness`, `--local`, `--ref`, `--playbooks`, `--extension`, `--with-playbooks`, and `--without-playbooks` are unknown flags. `cli.test.ts` asserts they die.

### Plan

`planFromProfile` builds the dest writes.

- **stacks**: YAML only. Each named folder under `stacks/` contributes its skills, agents, and prompts. An unknown name fails at load.
- **skills**: start from `profile.skills` plus skills from named stacks, add `--with`, drop `--without`, then sort. `installSkills` always runs. An empty list copies nothing.
- **agents**: YAML plus named stacks. Overlay when the key is not omit or a named stack has agents. No CLI add or remove. `all` is the pack library under `ai/agents/` only.
- **prompts**: YAML plus named stacks. Overlay when the key is not omit or a named stack has prompts. No CLI add or remove. `all` is the pack library under `ai/prompts/` only.

Unknown agent or prompt ids fail in `resolveNamedIds` when the plan is built. Field rules are [[schema-profile]].

### Dest writes

Selected skills copy from `ai/skills/` or `stacks/<stack>/skills/` to `.opencode/skills/<name>/`. `findSkillDir` walks pack skills first, then stack skills. A missing name fails with `Skill not found in source`. Overlay agents write `.opencode/agents/<id>.md` from `ai/agents/` or `stacks/<stack>/agents/`. Overlay prompts write `.opencode/commands/<id>.md` from nested `ai/prompts/` or `stacks/<stack>/prompts/` markdown. Duplicate stems fail. Each overlay updates listed ids. Extra dest markdown of that kind stays. Extra dest skill dirs and extra dest playbooks stay, except parked leftovers. Install does not write `.opencode/playbooks/`.

Profile install calls `removeLeftovers`, which deletes installer-owned `.pi/extensions`, `.pi/lib`, `.pi/roles`, `.pi/vendor/@agentic-core`, parked dest copies of first-party Pi plugins, and `.pi/skills/agent-teams`. Other dest extras stay. Install does not write `APPEND_SYSTEM.md`, `.opencode/settings.json`, or first-party npm copies.

There is no `ai/pi/` pack folder. Pi runtime markdown lives under `deprecated/system-prompts/` and is not copied.

## Acceptance

- The command accepts `<target>`, `--profile`, `--with`, and `--without`
- A leftover `frameworks:` key dies at load. Hivemind is not installed from this pack. See [[0019-hivemind-own-repo]]
- A leftover `packages:`, `settings:`, `system-prompt:`, or `extensions:` key dies at load
- A profile can name a stack under `stacks/` and install copies that unit
- A profile can select `agents` and `prompts` from the source libraries
- Extra dest skills, agents, playbooks, and commands survive a reinstall
- Install does not write `.opencode/playbooks/`
- Install does not write `.pi/`
- `--harness` and `--extension` are unknown flags
- Dest has no live path back to this checkout

## Open questions

- (none)
