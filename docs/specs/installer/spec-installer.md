---
id: "spec-installer"
title: "Installer spec"
kind: spec
description: "CLI, dest npm tree, settings merge, and overwrite rules for install from this repo."
status: draft
domain: pack
area: installer
tags: [spec]
created_at: "2026-08-23"
updated_at: "2026-09-02"
---

# Installer spec

## Goal

Define how `pnpm exec agentic-core install` copies a self-contained tree into a dest.

## Requirements

The command is `pnpm exec agentic-core install <target>`.

`parseArgs` in `packages/installer/src/cli.ts` accepts:

- **`--profile`**: load `profiles/<name>/profile.yaml`
- **`--extension`**: first-party package. Repeatable.
- **`--with`**: comma-separated skill folder names to add
- **`--without`**: comma-separated skill folder names to drop
- **`-h`, `--help`**: print usage

`--extension` may repeat. A name outside `FIRST_PARTY_EXTENSIONS` dies with `Unknown extension`.
A profile install also installs that profile's `packages` list and optional `frameworks` list.
Dest pack is always `.pi/`. Project-root `hivemind.yaml` is write-if-missing convention, not dest pack.

The dest receives a first-party copy at `.pi/npm/local/@agentic-core/<name>`.
Dest settings gain a dest-relative `npm/local/@agentic-core/<name>` source.
Settings do not list `npm:@agentic-core/<name>`.
Re-running install overwrites the copy.
The dest has no sibling lib package.

Agents, skills, prompts, and third-party `npm:` sources still merge the way they do today.
Dest extras stay. Overlay writers update listed files and do not prune other dest markdown.
The installer does not select or copy playbooks. An existing dest `.pi/playbooks/` survives reinstall.
First-party extensions never copy from `pi/extensions/`. The copy reads `packages/<name>`.

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
```

`--harness`, `--local`, `--ref`, `--playbooks`, `--with-playbooks`, and `--without-playbooks` are unknown flags. `cli.test.ts` asserts they die.

### Two install paths

`run` splits after `openDestination`.

- **Extensions-only**: `--profile` omitted and at least one `--extension`. No default profile. `run` still calls `dest.ensureGitignore`. `writeExtensions` copies those packages into dest npm and merges their settings sources. Skills, agents, prompts, and `writeRuntime` do not run.
- **Profile install**: `--profile <name>`, or no `--profile` and no `--extension`. The name is `opts.profile ?? DEFAULT_PROFILE`. `DEFAULT_PROFILE` is `agentic-core`. `loadProfile` then `planFromProfile` then dest writes.

`--profile` and `--extension` may be used together. That is a profile install. `resolvePackages` appends the CLI local names after `profile.packages`. First source wins. Duplicates drop.

### Plan

`planFromProfile` builds the dest writes.

- **skills**: start from `profile.skills`, add `--with`, drop `--without`, then sort. `installSkills` always runs. An empty list copies nothing.
- **agents**: YAML only. Overlay when the key is not omit. No CLI add or remove.
- **prompts**: YAML only. Overlay when the key is not omit. No CLI add or remove.
- **packages**: `profile.packages` then CLI `--extension` names.
- **frameworks**: `profile.frameworks`. Copy each `frameworks/<name>/` to `.pi/frameworks/<name>/` (`package.json` + non-test `src/`). Reinstall overwrites that tree. Not a settings `packages` entry.
- **hivemind.yaml**: if `hivemind` is in `frameworks` and `profiles/<name>/hivemind.yaml` exists, copy to dest project-root `hivemind.yaml` only when that dest file is missing.
- **settings**: optional untyped map from the profile. Missing or null is omit.
- **system-prompt**: YAML only. Optional stem. No CLI add or remove. Unknown or missing `ai/system-prompts/<stem>.md` fails in `planFromProfile` when the plan is built.

Unknown agent or prompt ids fail in `resolveNamedIds` when the plan is built. Unknown `system-prompt` stems fail in `planFromProfile` when the plan is built. Invalid package sources fail in `loadProfile`. Field rules are [[schema-profile]].

### Dest writes

Selected skills copy from `ai/skills/` to `.pi/skills/<name>/`. `findSkillDir` walks with `walkSkillDirs`. A missing name fails with `Skill not found in source`. Overlay agents write `.pi/agents/<id>.md`. Overlay prompts write `.pi/prompts/<id>.md`. Each overlay updates listed ids. Extra dest markdown of that kind stays. Extra dest skill dirs, extra dest playbooks, and extra settings keys stay, except parked leftovers. Install does not write `.pi/playbooks/`.

Profile install then calls `writeRuntime`. That requires `ai/system-prompts/default.md`. It does not require or write `heio-models.md`. An existing dest `.pi/heio-models.md` stays. It calls `removeLeftovers`, which deletes `.pi/extensions`, `.pi/lib`, `.pi/roles`, installer-owned `.pi/vendor/@agentic-core`, parked dest copies of `heio-coms`, `heio-teams`, `heio-todo`, and `heio-coord`, and `.pi/skills/agent-teams`. Other dest extras stay. It writes `.pi/APPEND_SYSTEM.md` when missing or when the current file is a known legacy stub. The body is `ai/system-prompts/<stem>.md` when the profile sets `system-prompt: <stem>`, else `ai/system-prompts/default.md`. It writes `.pi/.gitignore` as `npm/\ngit/\n` when missing.

There is no `ai/pi/` pack folder. A `packages.json` next to system prompts is not merged on install.

### Local packages and settings

`writeVendorTrees` copies each named first-party package as it is into dest npm. Dest does not receive a sibling lib package. It also removes installer-owned `.pi/vendor/@agentic-core`.

```ts
// packages/installer/src/extensions.ts — writeVendorExtension
const srcPkg = join(srcRoot, "packages", name);
const destRel = join(".pi", "npm", "local", "@agentic-core", name);
dest.remove(join(".pi", "npm", "node_modules", "@agentic-core", name));
dest.remove(destRel);
dest.ensureDir(destRel);
dest.copyFile(join(srcPkg, "package.json"), join(destRel, "package.json"));
copyTsSources(join(srcPkg, "src"), dest, join(destRel, "src"));
```

`copyTsSources` copies `.ts` files and skips `*.test.ts`. Re-run deletes the dest folder first, so leftover files go away.

The package `@agentic-core/heio-boot` lands at `.pi/npm/local/@agentic-core/heio-boot`. The same shape holds for `heio-footer` and `heio-onic`. Parked `heio-coms`, `heio-teams`, `heio-todo`, and `heio-coord` dest copies are removed on profile install. Leftover `.pi/npm/node_modules/@agentic-core/<name>` copies for names the installer writes also go away.

`dest.mergePackages` writes `.pi/settings.json`. Sources are dest-relative. `canonicalizePackageSource` rewrites `vendor/@agentic-core/<name>`, `.pi/vendor/@agentic-core/<name>`, and `npm/node_modules/@agentic-core/<name>` to `npm/local/@agentic-core/<name>`. Leftover vendor settings drop when that local path is present. No path back to this checkout.

Third-party sources such as `npm:pi-lens` come from `profile.packages` and merge into dest settings in list order.

Install then deep-merges `profile.settings` into dest `.pi/settings.json` when the key is not omit. Dest keys the profile does not name stay. Objects merge recursively. Profile wins scalar leaf conflicts and type mismatches. Arrays merge as sets. Dest order stays. Profile items append when not already present. Duplicates drop.

This checkout's Pi is not wired to `packages/`. Nothing vendors until the installer is pointed at a target.

## Acceptance

- The command accepts `<target>`, `--profile`, `--extension`, `--with`, and `--without`
- `--extension` can be passed more than once
- A profile install installs `profile.packages` into dest settings and copies first-party sources into dest npm
- A profile `frameworks:` list copies those trees to `.pi/frameworks/<name>/` and does not merge them into settings `packages`
- First install may write project-root `hivemind.yaml`; reinstall does not overwrite it
- A profile can select `agents` and `prompts` from the source libraries
- A profile `system-prompt:` stem copies `ai/system-prompts/<stem>.md` to dest `.pi/APPEND_SYSTEM.md` when dest is missing or a known legacy stub; omit the key and install still copies `ai/system-prompts/default.md`
- Install does not require or write `heio-models.md`; an existing dest `.pi/heio-models.md` stays
- A profile `settings:` map deep-merges into dest `.pi/settings.json` after the packages union
- An extensions-only run copies packages into dest npm and does not copy skills
- First-party path is `.pi/npm/local/@agentic-core/<name>`
- Settings contain dest-relative `npm/local/@agentic-core/<name>` paths
- Settings do not list `npm:@agentic-core/<name>`
- Re-run overwrites the dest npm copy
- Extra dest skills, agents, playbooks, prompts, and settings keys survive a reinstall
- Install does not write `.pi/playbooks/`
- Dest rewrite removes installer-owned `.pi/vendor/@agentic-core` and keeps other dest extras
- `vendor:` and `vendor/` sources fail at profile load
- Third-party `npm:` sources still merge
- First-party extensions are not read from `pi/extensions/`
- `--harness` is an unknown flag
- Installer tests write a temp dest and check settings plus the dest npm tree
- Dest has no live path back to this checkout
- Dest has no sibling lib package

## Open questions

- (none)
