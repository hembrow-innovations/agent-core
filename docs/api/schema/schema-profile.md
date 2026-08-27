---
id: "schema-profile"
title: "Profile YAML schema"
kind: schema
description: "Fields, leftover-key errors, and YAML subset for profiles/*.yaml."
domain: pack
area: installer
tags: [schema, installer, profiles]
source: "packages/installer/src/profile.ts"
created_at: "2026-08-25"
updated_at: "2026-08-26"
---

# Profile YAML schema

A profile is a named install set. `--profile <name>` loads `profiles/<name>.yaml`. The filename stem is the name. There is no `name:` key.

`packages/installer/src/profile.ts` parses the file. It is a YAML subset, not a general YAML library. Dest is always `.pi/`. Profiles do not name a dest. See [[0005-pi-only-dest]].

## Fields

Allowed keys are `skills`, `agents`, `prompts`, `packages`, and `settings`. All five are optional. `PROFILE_KEYS` is that set.

- **skills.** String list of skill folder names. Missing or `null` becomes `[]`. A present non-list is an error. Each name must be a directory under `ai/skills/` that holds `SKILL.md`. `findSkillDir` walks with `walkSkillDirs` from `pack-walk.ts`. If two directories share a basename, install prefers `ai/skills/workflow/`, then `ai/skills/setup/`, then the first walk hit. Install copies each name to `.pi/skills/<name>/`. A typo parses. Copy then fails with `Skill not found in source`. CLI `--with` and `--without` change the planned list. That overlay is [[spec-installer]].

- **agents.** One of three shapes. Missing, `null`, or `~` is omit. `all` selects every `ai/agents/<id>/` directory that holds `<id>.md`. The stem must match `^[a-z][a-z0-9-]{0,63}$`. A list selects those ids. Overlay writes `.pi/agents/<id>.md`. Extra dest agent markdown stays. Any other scalar, including `true` or `false`, is `Invalid agents value`.

- **prompts.** Same three shapes as agents. `all` selects every `ai/prompts/*.md` except `README.md`. Overlay writes `.pi/prompts/<id>.md`. Extra dest prompt markdown stays.

- **packages.** String list of Pi package sources. Missing or `null` becomes `[]`. A present non-list is an error. Each item is `npm:<name>` or `local:@agentic-core/<name>`. Local names must be `draconic-todo`, `draconic-coms`, `draconic-boot`, `draconic-teams`, or `draconic-footer`. A bare first-party name is an error. Use the `local:` source. `vendor:` and `vendor/` sources fail at load. `npm:` with nothing after the prefix is `Invalid package source`. Install copies those trees to `.pi/npm/node_modules/@agentic-core/<name>` and merges dest-relative `npm/node_modules/@agentic-core/<name>` into `.pi/settings.json` `packages` in list order. Settings do not list `npm:@agentic-core/<name>`. `--extension` appends a local source. Profile order wins, then CLI, duplicates dropped.

- **settings.** Untyped map merged into dest `.pi/settings.json`. Missing or `null` is omit. A present non-map is `"settings" must be a map`. There is no key allowlist. Unknown keys are not rejected. `settings.packages` is not a load error. `packages:` stays a sibling and keeps the package-source union. Install merges `packages:` first, then deep-merges `settings:`. Dest keys the profile does not name stay. Objects merge recursively. Profile wins scalar leaf conflicts and type mismatches. Arrays merge as sets. Dest order stays. Profile items append when not already present. Duplicates drop. Scalar equality is value equality. Nested array values compare with `JSON.stringify`.

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

`listProfiles` reads `profiles/*.yaml`, ignores `readme.yaml`, and sorts the stems. `.yml` is not a profile. A missing file is `Unknown profile "<name>". Choose: ...`.

Unknown agent or prompt ids fail when the plan is built, not at parse. Invalid package sources fail at load.

Profile `packages` is the install list. `readPiPackages` can read `ai/pi/packages.json`. `writeRuntime` does not merge that file.

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
# Develop this repo in Pi. Not an export profile.
agents: all
prompts: all
packages:
  - npm:pi-lens
  - local:@agentic-core/draconic-todo
settings:
  toolDescriptionMode: compact
  defaultTools:
    - read
    - bash
skills:
  - diagnose
  - tdd
```

Shipped files are `profiles/agentic-core.yaml`, `profiles/life-engine.yaml`, and `profiles/planning-hub.yaml`. `agentic-core` and `life-engine` use `agents: all` and `prompts: all`. `agentic-core` is the skill list for developing this pack and ships example `settings:`. `life-engine` has no `settings:` key. `planning-hub` is skills-only (`planning`, `wayfinder`).

Install flags and dest writes live in [[spec-installer]]. Run install from [[guides-install-from-this-repo]].
