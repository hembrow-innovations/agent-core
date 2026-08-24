# Profiles

`pnpm exec agentic-core install <target> --profile NAME` loads `profiles/NAME.yaml`. Dest is always `.pi/`.

## Schema

```yaml
mode: draconic        # optional. If set, install adds {mode}-mode to the skill list
skills:               # skill folder names to copy. Default: []
  - architect
playbooks: all        # omit the key, `all`, or a list of playbook ids
extensions:           # first-party package folder names. Default: []
  - draconic-todo
```

Install writes `.pi/skills` and the Pi pack into `.pi/`:

- first-party vendor packages from `profile.extensions` into `.pi/vendor/@agentic-core/`
- `ai/pi/prompts/*.md` whose stem is in the installed skill list or playbook list
- `ai/pi/APPEND_SYSTEM.md` and `ai/pi/draconic-models.md` if those dest files are missing
- `.pi/.gitignore` if that file is missing
- package sources from `ai/pi/packages.json` into `.pi/settings.json`

`ai/pi/roles/` is required. Install copies each pack `*.md` whose stem matches the role name pattern into `.pi/roles/` only when that dest file is missing, and overwrites `.pi/roles/argv.mjs` every time. Dest role files are not pruned.

A missing `ai/pi/APPEND_SYSTEM.md`, `ai/pi/draconic-models.md`, or `ai/pi/roles/` is an error. `ai/pi/prompts/` is optional.

`ai/pi/packages.json` is a JSON array of Pi package sources such as `npm:pi-lens`. Install merges those sources into `.pi/settings.json` `packages` and leaves other settings keys alone. An existing object-form entry with the same `source` counts as present. Pi then installs any missing project packages on the next trusted startup.

A leftover `harness:`, `pi:`, `agents:`, `prompts:`, `templates:`, or `commands:` key is an error. The message says dest is always `.pi`. Unknown YAML keys are an error.

Boolean keys are not used. `mode` defaults to unset. `skills` and `extensions` default to empty lists. A profile install also vendors `extensions`. `--extension` names install on top of that list.

## Playbooks

`ai/playbooks/` is the library. Install copies the selected files into `{mode}-mode/playbooks/` and rewrites that skill's matching list.

- **key omitted**: The mode skill's bundled playbooks stay as copied from source
- **`all`**: Every `playbooks/*.md` except README
- **list of ids**: Those files, including an empty list

`--playbooks a,b` replaces the profile selection. `--with-playbooks` and `--without-playbooks` add or remove ids after that.

Playbook files live at `ai/playbooks/<id>.md` with `title` and `when` frontmatter. A profile names the ids it ships, or sets `playbooks: all`. Install overwrites copies inside a mode skill from the library.
