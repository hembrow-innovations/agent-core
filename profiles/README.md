# Profiles

Each `*.yaml` file in this folder is an install profile. `scripts/install.mjs --profile NAME` loads `profiles/NAME.yaml`.

## Schema

```yaml
mode: draconic        # optional. If set, install adds {mode}-mode to the skill list
skills:               # skill folder names to copy. Default: []
  - architect
playbooks: all        # omit the key, `all`, or a list of playbook ids
agents: true          # copy agents/. Default: false
commands: true        # copy commands/. Default: false
templates: true       # copy templates/opencode. Default: false
pi: true              # copy the Pi pack from pi/. Default: false
```

Boolean keys default to false. `mode` defaults to unset. `skills` defaults to an empty list.

`pi: true` copies the profile skill list from `skills/` into `.pi/skills/` and `.agents/skills/`, then copies Pi runtime files from `pi/` (extensions, prompts, `APPEND_SYSTEM.md`). `--pi` and `--no-pi` override the profile.

`pi/` is runtime config only. It does not own skills. The `pi` profile is the flag plus the draconic skill list. Draconic-family profiles (`draconic`, `godot`, `full`, `life-engine`) include it.

## Playbooks

`playbooks/` is the library. A profile selects which files install copies into `{mode}-mode/playbooks/` and which bullets appear in that skill's matching list.

| Value | Install |
|-------|---------|
| key omitted | Leave the mode skill's bundled playbooks alone |
| `all` | Copy every `playbooks/*.md` except README |
| list of ids | Copy those files, including an empty list |

`--playbooks a,b` replaces the profile selection. `--with-playbooks` and `--without-playbooks` add or remove ids after that.

## Add a playbook

1. Write `playbooks/<id>.md` with `title` and `when` frontmatter.
2. List `<id>` in the profiles that should ship it, or use `playbooks: all`.
3. Do not edit copies inside a mode skill. Install overwrites those from the library.
