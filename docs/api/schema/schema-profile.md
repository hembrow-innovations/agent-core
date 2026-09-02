---
id: "schema-profile"
title: "Profile YAML schema"
kind: schema
description: "Fields, leftover-key errors, and YAML subset for profiles/<name>/profile.yaml."
domain: pack
area: installer
tags: [schema, installer, profiles]
source: "packages/installer/src/profile.ts"
created_at: "2026-08-25"
updated_at: "2026-09-02"
---

# Profile YAML schema

A profile is a named install set. `--profile <name>` loads `profiles/<name>/profile.yaml`. The directory stem is the name. There is no `name:` key. Flat `profiles/<name>.yaml` is not a profile. See [[0016-profiles-are-directories]].

`packages/installer/src/profile.ts` parses the file. It is a YAML subset, not a general YAML library. Dest is always `.pi/`. Profiles do not name a dest. See [[0005-pi-only-dest]].

## Fields

Allowed keys are `skills`, `agents`, `prompts`, `packages`, `settings`, `frameworks`, and `system-prompt`. All seven are optional. `PROFILE_KEYS` is that set.

- **skills.** String list of skill folder names. Missing or `null` becomes `[]`. A present non-list is an error. Each name must be a directory under `ai/skills/` that holds `SKILL.md`. `findSkillDir` walks with `walkSkillDirs` from `pack-walk.ts`. If two directories share a basename, install prefers `ai/skills/workflow/`, then `ai/skills/setup/`, then the first walk hit. Install copies each name to `.pi/skills/<name>/`. A typo parses. Copy then fails with `Skill not found in source`. CLI `--with` and `--without` change the planned list. That overlay is [[spec-installer]].

- **agents.** One of three shapes. Missing, `null`, or `~` is omit. `all` selects every `ai/agents/<id>/` directory that holds `<id>.md`. The stem must match `^[a-z][a-z0-9-]{0,63}$`. A list selects those ids. Overlay writes `.pi/agents/<id>.md`. Extra dest agent markdown stays. Any other scalar, including `true` or `false`, is `Invalid agents value`.

- **prompts.** Same three shapes as agents. `all` selects every `ai/prompts/*.md` except `README.md`. Overlay writes `.pi/prompts/<id>.md`. Extra dest prompt markdown stays.

- **packages.** String list of Pi package sources. Missing or `null` becomes `[]`. A present non-list is an error. Each item is `npm:<name>` or `local:@agentic-core/<name>`. Local names must be `heio-boot`, `heio-footer`, or `heio-onic`. A bare first-party name is an error. Use the `local:` source. `vendor:` and `vendor/` sources fail at load. `npm:` with nothing after the prefix is `Invalid package source`. Install copies those trees to `.pi/npm/local/@agentic-core/<name>` and merges dest-relative `npm/local/@agentic-core/<name>` into `.pi/settings.json` `packages` in list order. Those copies stay outside `.pi/npm/node_modules/` so Pi npm install cannot delete them. Settings do not list `npm:@agentic-core/<name>`. `--extension` appends a local source. Profile order wins, then CLI, duplicates dropped.

- **settings.** Untyped map merged into dest `.pi/settings.json`. Missing or `null` is omit. A present non-map is `"settings" must be a map`. There is no key allowlist. Unknown keys are not rejected. `settings.packages` is not a load error. `packages:` stays a sibling and keeps the package-source union. Install merges `packages:` first, then deep-merges `settings:`. Dest keys the profile does not name stay. Objects merge recursively. Profile wins scalar leaf conflicts and type mismatches. Arrays merge as sets. Dest order stays. Profile items append when not already present. Duplicates drop. Scalar equality is value equality. Nested array values compare with `JSON.stringify`.

- **frameworks.** String list of framework folder names under `frameworks/`. Missing or `null` becomes `[]`. A present non-list is an error. Each name must be a directory under `frameworks/<name>/` that holds `package.json`. Unknown names fail at plan time. Install copies `package.json` and non-test `src/` to `.pi/frameworks/<name>/`. Reinstall overwrites that tree. Frameworks are not Pi packages and do not enter `.pi/settings.json` `packages`. If `hivemind` is listed and `profiles/<name>/hivemind.yaml` exists, install copies that file to dest project-root `hivemind.yaml` **only when missing**. Reinstall never overwrites the dest yaml. Runtime of Hivemind fail-closes without that file. See [[0015-hivemind-is-a-framework]] and [[schema-hivemind]].

- **system-prompt.** Optional string stem. Missing or `null` omits the field. A present non-string is `"system-prompt" must be a string`. The stem names `ai/system-prompts/<stem>.md`. Unknown or missing stems fail at plan time, not at parse. Install copies that markdown to dest `.pi/APPEND_SYSTEM.md` with the same write-if-missing / legacy-stub replace as today. Omit the key and install still copies `ai/system-prompts/default.md`. Dest filename stays `.pi/APPEND_SYSTEM.md`. See [[spec-installer]].

```ts
// packages/installer/src/profile.ts — loadProfile leftover keys
const leftover = LEFTOVER_KEYS.get(key);
if (leftover) throw new Error(`Profile "${name}" has ${leftover}`);
if (!PROFILE_KEYS.has(key)) {
  throw new Error(`Unknown profile key "${key}"`);
}
```

## Constraints

Unknown keys fail. These leftovers have their own messages because they used to mean something:

- **playbooks.** The installer does not copy playbooks. Dest `.pi/playbooks/` is not pruned.
- **mode.** Dest playbooks live at `.pi/playbooks`.
- **extensions.** Use `packages:`.
- **harness**, **pi**, **templates**, **commands.** Dest is always `.pi`.

`agents` and `prompts` are selection lists now. They are not dest keys. [[0005-pi-only-dest]] banned the old meaning.

`listProfiles` reads `profiles/*/profile.yaml`, ignores names that start with `.`, and sorts the directory stems. A leftover flat `profiles/<name>.yaml` is not a profile. A missing directory or missing `profile.yaml` is `Unknown profile "<name>". Choose: ...`.

Unknown agent or prompt ids fail when the plan is built, not at parse. Unknown `system-prompt` stems fail when the plan is built, not at parse. Invalid package sources fail at load.

Profile `packages` is the install list. There is no `ai/pi/` pack folder. `writeRuntime` does not merge a `packages.json`. `readPiPackages` still parses that filename when a caller passes a dir that has one.

CLI replace and add rules, and the default profile name, live in [[spec-installer]].

### YAML subset

Nested maps and lists of maps parse at any depth. Indentation is the nesting signal. Flow maps `{a: 1}` still fail.

Lists are block items under a key, or a flow list `[a, b]`. A list item with no pending key fails. A key that already has a scalar cannot grow nested children.

JSON-like numbers stay numbers. The pattern is `-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?`. Quoted numbers stay strings. Leading zeros stay strings.

Booleans and null stay typed. `true`, `false`, `null`, `~`.

No anchors. No block scalars.

`#` starts a comment outside quotes.

Scalars are `true`, `false`, `null`, `~`, `[]`, a flow list, a JSON-like number, or a string. Double quotes unescape `\"` and `\n`. Single quotes turn `''` into `'`. Empty list items are dropped.

## Example

```yaml
# profiles/agentic-core/profile.yaml
# Develop this repo in Pi. Not an export profile.
agents: all
prompts: all
packages:
  - npm:pi-lens
  - npm:@inobit/pi-todo@0.1.1
frameworks:
  - hivemind
settings:
  toolDescriptionMode: compact
  defaultTools:
    - read
    - bash
skills:
  - diagnose
  - tdd
# system-prompt: persona
```

Shipped profiles are directories under `profiles/`: `agentic-core`, `life-engine`, `planning-hub`, and others. Each has `profile.yaml`. Optional sibling `hivemind.yaml` is the write-if-missing dest template. `agentic-core` and `life-engine` use `agents: all` and `prompts: all`. `agentic-core` is the skill list for developing this pack and ships example `settings:`. `life-engine` has no `settings:` key. `planning-hub` is skills-only (`planning`, `wayfinder`).

Install flags and dest writes live in [[spec-installer]]. Run install from [[guides-install-from-this-repo]].
