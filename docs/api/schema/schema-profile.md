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
updated_at: "2026-08-25"
---

# Profile YAML schema

A profile is a named install set. `--profile <name>` loads `profiles/<name>.yaml`. The filename stem is the name. There is no `name:` key.

`packages/installer/src/profile.ts` parses the file. It is a YAML subset, not a general YAML library. Dest is always `.pi/`. Profiles do not name a dest. See [[0005-pi-only-dest]].

## Fields

Allowed keys are `skills`, `playbooks`, `agents`, `prompts`, and `packages`. All five are optional.

- **skills.** String list of skill folder names. Missing or `null` becomes `[]`. A present non-list is an error. Each name must be a directory under `ai/skills/` that holds `SKILL.md`. If two directories share a basename, install prefers `ai/skills/workflow/`, then `ai/skills/setup/`, then the first walk hit. Install copies each name to `.pi/skills/<name>/`. A typo parses. Copy then fails with `Skill not found in source`. `--with` adds names. `--without` removes them.

- **playbooks.** One of three shapes. Missing, `null`, or `~` is omit. Dest `.pi/playbooks/` stays put unless a CLI playbook flag writes it. `all` selects every `ai/playbooks/*.md` except `README.md`. A list selects those ids, including an empty list. An empty list is not omit. It overlays dest and deletes the markdown already there. Any other scalar, including `true` or `false`, is `Invalid playbooks value`.

- **agents.** Same three shapes as playbooks. `all` selects every `ai/agents/<id>/` directory that holds `<id>.md`. A list selects those ids. Overlay writes `.pi/agents/<id>.md` and deletes other dest agent markdown.

- **prompts.** Same three shapes as playbooks. `all` selects every `ai/prompts/*.md` except `README.md`. Overlay writes `.pi/prompts/<id>.md` and deletes other dest prompt markdown.

- **packages.** String list of Pi package sources. Missing or `null` becomes `[]`. A present non-list is an error. Each item is `npm:<name>` or `vendor/@agentic-core/<name>`. Vendor names must be `draconic-todo`, `draconic-coms`, `draconic-boot`, or `draconic-teams`. A bare first-party name is an error. Use the vendor path. Install vendors those trees to `.pi/vendor/@agentic-core/<name>` and merges every source into `.pi/settings.json` `packages` in list order. `--extension` appends a vendor source. Profile order wins, then CLI, duplicates dropped.

## Constraints

Unknown keys fail. These leftovers have their own messages because they used to mean something:

- **mode.** Dest playbooks live at `.pi/playbooks`.
- **extensions.** Use `packages:`.
- **harness**, **pi**, **templates**, **commands.** Dest is always `.pi`.

`agents` and `prompts` are selection lists now. They are not dest keys. [[0005-pi-only-dest]] banned the old meaning.

`listProfiles` reads `profiles/*.yaml`, ignores `readme.yaml`, and sorts the stems. `.yml` is not a profile. A missing file is `Unknown profile "<name>". Choose: ...`.

The default CLI profile is `agentic-core` when `--profile` is omitted and the command is not an extensions-only install.

`--playbooks a,b` replaces the YAML selection. `--with-playbooks` and `--without-playbooks` add or remove ids after that. If the key is omitted, `--without-playbooks` alone does not write dest playbooks. `--with-playbooks` or `--playbooks` does.

Unknown playbook, agent, or prompt ids fail when the plan is built, not at parse. Invalid package sources fail at load.

Profile `packages` is the install list. `ai/pi/packages.json` is not merged on install.

### YAML subset

Top-level keys only. Nested maps fail, including `{` outside quotes.

Lists are block items under a key, or a flow list `[a, b]`. A list item with no pending key fails. A key that already has a scalar cannot grow a list.

No anchors. No block scalars.

`#` starts a comment outside quotes.

Scalars are `true`, `false`, `null`, `~`, `[]`, a flow list, or a string. Double quotes unescape `\"` and `\n`. Single quotes turn `''` into `'`. Empty list items are dropped.

## Example

```yaml
# Develop this repo in Pi. Not an export profile.
playbooks: all
agents:
  - architect
  - coder
prompts:
  - arena
  - figure-it-out
packages:
  - npm:pi-lens
  - npm:pi-web-access
  - npm:pi-subagents
  - npm:@ff-labs/pi-fff
  - vendor/@agentic-core/draconic-todo
  - vendor/@agentic-core/draconic-coms
  - vendor/@agentic-core/draconic-boot
  - vendor/@agentic-core/draconic-teams
skills:
  - docs
  - how
```

Shipped files are `profiles/agentic-core.yaml` and `profiles/life-engine.yaml`. Both use `agents: all` and `prompts: all`. `agentic-core` is the skill list for developing this pack.

Install flags and dest writes live in [[spec-installer]]. Run install from [[guides-install-from-this-repo]].
