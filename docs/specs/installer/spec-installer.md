---
id: "spec-installer"
title: "Installer spec"
kind: spec
description: "CLI, dest vendor tree, settings merge, and overwrite rules for install from this repo."
status: draft
domain: pack
area: installer
tags: [spec]
created_at: "2026-08-23"
updated_at: "2026-08-26"
---

# Installer spec

## Goal

Define how `pnpm exec agentic-core install` copies a self-contained tree into a dest.

## Requirements

The command is `pnpm exec agentic-core install <target>`.

`parseArgs` in `packages/installer/src/cli.ts` accepts:

- **`--profile`**: load `profiles/<name>.yaml`
- **`--extension`**: first-party vendor package. Repeatable.
- **`--with`**: comma-separated skill folder names to add
- **`--without`**: comma-separated skill folder names to drop
- **`--playbooks`**: replace the profile playbook selection
- **`--with-playbooks`**: add playbook ids
- **`--without-playbooks`**: drop playbook ids
- **`-h`, `--help`**: print usage

`--extension` may repeat. A name outside `FIRST_PARTY_EXTENSIONS` dies with `Unknown extension`.
A profile install also installs that profile's `packages` list.
Dest is always `.pi/`.

The dest receives a vendor copy at `.pi/vendor/@agentic-core/<name>`.
Dest settings gain a dest-relative `vendor/@agentic-core/<name>` source.
Re-running install overwrites the vendor copy.
The dest has no sibling lib package.

Agents, skills, playbooks, prompts, and third-party `npm:` sources still merge the way they do today.
First-party extensions never copy from `pi/extensions/`. `writeVendorExtension` reads `packages/<name>`.

The dest must commit `.pi/vendor/` and the settings that point at it.
This checkout is the only install source.
A dest never depends on this checkout at runtime.

## Non-goals

- Uninstall
- npm publish
- A `git:` package source for first-party extensions
- A curl entry such as `curl | node scripts/install.mjs`
- A dest other than `.pi/`
- A profile key that names a dest

## Behaviour

`<target>` is a dest directory. `.` is allowed. `parseArgs` dies on a missing target. `run` dies if the target path does not exist.

`repoRoot` walks three directories up from `cli.ts` and dies unless `profiles/` and `ai/skills/` exist. The CLI must run from this checkout.

```ts
// packages/installer/src/cli.ts — parseArgs
else if (a === "--profile") out.profile = need(args, a);
else if (a === "--with") out.with.push(...csv(need(args, a)));
else if (a === "--without") out.without.push(...csv(need(args, a)));
else if (a === "--playbooks") out.playbooks = csv(need(args, a));
else if (a === "--with-playbooks")
  out.withPlaybooks.push(...csv(need(args, a)));
else if (a === "--without-playbooks")
  out.withoutPlaybooks.push(...csv(need(args, a)));
```

`--harness`, `--local`, and `--ref` are unknown flags. `cli.test.ts` asserts they die.

### Two install paths

`run` splits after `openDestination`.

- **Extensions-only**: `--profile` omitted and at least one `--extension`. No default profile. `run` still calls `dest.ensureGitignore`. `writeExtensions` vendors those packages and merges their settings sources. Skills, playbooks, agents, prompts, and `writeRuntime` do not run.
- **Profile install**: `--profile <name>`, or no `--profile` and no `--extension`. The name is `opts.profile ?? DEFAULT_PROFILE`. `DEFAULT_PROFILE` is `agentic-core`. `loadProfile` then `planFromProfile` then dest writes.

`--profile` and `--extension` may be used together. That is a profile install. `resolvePackages` appends the CLI vendor names after `profile.packages`. First source wins. Duplicates drop.

### Plan

`planFromProfile` builds the dest writes.

- **skills**: start from `profile.skills`, add `--with`, drop `--without`, then sort. `installSkills` always runs. An empty list copies nothing.
- **playbooks**: `resolvePlaybookIds` uses `--playbooks` as replace, then `--with-playbooks`, then `--without-playbooks`. Overlay writes dest when the YAML key is not omit, or `--playbooks` is set, or `--with-playbooks` is non-empty. `--without-playbooks` alone does not write dest playbooks when the key is omit.
- **agents**: YAML only. Overlay when the key is not omit. No CLI add or remove.
- **prompts**: YAML only. Overlay when the key is not omit. No CLI add or remove.
- **packages**: `profile.packages` then CLI `--extension` names.

Unknown playbook, agent, or prompt ids fail in `resolveNamedIds` when the plan is built. Invalid package sources fail in `loadProfile`. Field rules are [[schema-profile]].

### Dest writes

Selected skills copy from `ai/skills/` to `.pi/skills/<name>/`. `findSkillDir` walks with `walkSkillDirs`. A missing name fails with `Skill not found in source`. Overlay playbooks write `.pi/playbooks/`. Overlay agents write `.pi/agents/<id>.md`. Overlay prompts write `.pi/prompts/<id>.md`. Each overlay deletes other dest markdown of that kind, then copies the selected ids.

Profile install then calls `writeRuntime`. That requires `ai/pi/APPEND_SYSTEM.md` and `ai/pi/draconic-models.md`. It calls `removeLeftovers`, which deletes `.pi/extensions`, `.pi/lib`, and `.pi/roles`. It writes `.pi/APPEND_SYSTEM.md` when missing or when the current file is a known legacy stub. It writes `.pi/draconic-models.md` only when missing. It writes `.pi/.gitignore` as `npm/\ngit/\n` when missing. Vendor is not gitignored.

`ai/pi/packages.json` is not merged on install.

### Vendor and settings

`writeVendorTrees` copies each named first-party package as it is. Dest does not receive a vendor lib package.

```ts
// packages/installer/src/extensions.ts — writeVendorExtension
const srcPkg = join(srcRoot, "packages", name);
const destRel = join(".pi", "vendor", "@agentic-core", name);
dest.remove(destRel);
dest.ensureDir(destRel);
dest.copyFile(join(srcPkg, "package.json"), join(destRel, "package.json"));
copyTsSources(join(srcPkg, "src"), dest, join(destRel, "src"));
```

`copyTsSources` copies `.ts` files and skips `*.test.ts`. Re-run deletes the dest folder first, so leftover files go away.

The package `@agentic-core/draconic-todo` lands at `.pi/vendor/@agentic-core/draconic-todo`. The same shape holds for `draconic-coms`, `draconic-boot`, `draconic-teams`, and `draconic-footer`.

`dest.mergePackages` writes `.pi/settings.json`. Sources are dest-relative. `canonicalizePackageSource` rewrites `.pi/vendor/@agentic-core/<name>` to `vendor/@agentic-core/<name>`. No path back to this checkout.

Third-party sources such as `npm:pi-lens` come from `profile.packages` and merge into dest settings in list order.

This checkout's Pi is not wired to `packages/`. Nothing vendors until the installer is pointed at a target.

## Acceptance

- The command accepts `<target>`, `--profile`, `--extension`, `--with`, `--without`, `--playbooks`, `--with-playbooks`, and `--without-playbooks`
- `--extension` can be passed more than once
- A profile install installs `profile.packages` into dest settings and vendors first-party sources
- A profile can select `agents` and `prompts` from the source libraries
- An extensions-only run vendors packages and does not copy skills
- Vendor path is `.pi/vendor/@agentic-core/<name>`
- Settings contain dest-relative paths to those folders
- Re-run overwrites the vendor copy
- Third-party `npm:` sources still merge
- First-party extensions are not read from `pi/extensions/`
- `--harness` is an unknown flag
- Installer tests write a temp dest and check settings plus the vendor tree
- Dest has no live path back to this checkout
- Dest has no sibling lib package

## Open questions

- (none)
