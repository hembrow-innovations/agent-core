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
updated_at: "2026-09-06"
---

# Profile YAML schema

A profile is a named install set. `--profile <name>` loads `profiles/<name>/profile.yaml`. The directory stem is the name. There is no `name:` key. Flat `profiles/<name>.yaml` is not a profile. See [[0016-profiles-are-directories]].

`packages/installer/src/profile.ts` parses the file. It is a YAML subset, not a general YAML library. Dest is always `.opencode/`. Profiles do not name a dest. See [[0021-opencode-only-dest]].

## Fields

Allowed keys are `skills`, `agents`, and `prompts`. All three are optional. `PROFILE_KEYS` is that set.

- **skills.** String list of skill folder names. Missing or `null` becomes `[]`. A present non-list is an error. Each name must be a directory under `ai/skills/` that holds `SKILL.md`. `findSkillDir` walks with `walkSkillDirs` from `pack-walk.ts`. If two directories share a basename, install prefers `ai/skills/workflow/`, then `ai/skills/setup/`, then the first walk hit. Install copies each name to `.opencode/skills/<name>/`. A typo parses. Copy then fails with `Skill not found in source`. CLI `--with` and `--without` change the planned list. That overlay is [[spec-installer]].

- **agents.** One of three shapes. Missing, `null`, or `~` is omit. `all` selects every `ai/agents/<id>/` directory that holds `<id>.md`. The stem must match `^[a-z][a-z0-9-]{0,63}$`. A list selects those ids. Overlay writes `.opencode/agents/<id>.md`. Extra dest agent markdown stays. Any other scalar, including `true` or `false`, is `Invalid agents value`.

- **prompts.** Same three shapes as agents. `all` selects every markdown under `ai/prompts/` except `README.md`. `listPromptIds` walks with `walkPromptFiles` from `pack-walk.ts`. Duplicate stems fail. Overlay writes `.opencode/commands/<id>.md`. Extra dest command markdown stays.

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

- **playbooks.** The installer does not copy playbooks. Dest `.opencode/playbooks/` is not pruned.
- **mode.** The installer does not copy playbooks.
- **packages**, **extensions.** Pi packages are parked.
- **settings**, **system-prompt.** Pi runtime is parked.
- **harness**, **pi**, **templates.** Dest is always `.opencode`.
- **commands.** Use `prompts:`. Dest files land at `.opencode/commands/`.
- **frameworks.** Hivemind is not installed from this pack. See [[0019-hivemind-own-repo]].

`agents` and `prompts` are selection lists. They are not dest keys.

`listProfiles` reads `profiles/*/profile.yaml`, ignores names that start with `.`, and sorts the directory stems. A leftover flat `profiles/<name>.yaml` is not a profile. A missing directory or missing `profile.yaml` is `Unknown profile "<name>". Choose: ...`.

Unknown agent or prompt ids fail when the plan is built, not at parse.

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
# Develop this repo in OpenCode. Not an export profile.
agents:
  - heio-triage
  - heio-tasker
prompts:
  - heio-planning
skills:
  - diagnose
  - tdd
```

Shipped profiles are directories under `profiles/`: `agentic-core`, `life-engine`, `planning-hub`, and others. Each has `profile.yaml`. `agentic-core` is the skill list for developing this pack. `planning-hub` is skills-only plus agents and prompts `all`. `profiles/hivemind` installs this pack into the Hivemind dest. See [[0019-hivemind-own-repo]].

Install flags and dest writes live in [[spec-installer]]. Run install from [[guides-install-from-this-repo]].
