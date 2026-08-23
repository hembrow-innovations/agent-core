# Profiles

`pnpm exec agentic-core install <target> --profile NAME` loads `profiles/NAME.yaml`.

## Schema

```yaml
harness: opencode     # required. One of opencode, claude, pi, agents
mode: draconic        # optional. If set, install adds {mode}-mode to the skill list
skills:               # skill folder names to copy. Default: []
  - architect
playbooks: all        # omit the key, `all`, or a list of playbook ids
agents: true          # copy agents/. Default: false. Valid only when harness is opencode
commands: true        # copy commands/. Default: false. Valid only when harness is opencode
templates: true       # copy templates/opencode. Default: false. Valid only when harness is opencode
extensions:           # first-party package folder names. Default: []. Installed when dest harness is pi
  - draconic-todo
```

`harness` selects the dest tree from `HARNESSES` in `scripts/profile.mjs`.

| id | skill dest | runtime |
| ---- | ------------ | --------- |
| opencode | `.opencode/skills` | opencode |
| claude | `.claude/skills` | unset |
| pi | `.pi/skills` | pi |
| agents | `.agents/skills` | unset |

Install writes only that dest. `--harness <id>` overrides the profile value.

`runtime` `opencode` copies agents, commands, and templates when those profile flags are true and the matching `--no-*` flag is off.

`runtime` `pi` copies the Pi pack into `.pi/`:

- `pi/extensions/*.{ts,js}` to `.pi/extensions/`
- `pi/prompts/*.md` whose stem is in the installed skill list or playbook list
- `pi/APPEND_SYSTEM.md` and `pi/draconic-models.md` if those dest files are missing
- `.pi/.gitignore` if that file is missing
- package sources from `pi/packages.json` into `.pi/settings.json`

`pi/roles/` is required. Install copies each pack `*.md` whose stem matches the role name pattern into `.pi/roles/` only when that dest file is missing, and overwrites `.pi/roles/argv.mjs` every time. Dest role files are not pruned.

A missing `pi/APPEND_SYSTEM.md`, `pi/draconic-models.md`, `pi/prompts/`, `pi/extensions/`, or `pi/roles/` is an error.

`pi/packages.json` is a JSON array of Pi package sources such as `npm:pi-lens`. Install merges those sources into `.pi/settings.json` `packages` and leaves other settings keys alone. An existing object-form entry with the same `source` counts as present. Pi then installs any missing project packages on the next trusted startup.

A leftover `pi:` key is an error. The message says `use harness: pi`. Missing, empty, or unknown `harness` is an error and names the known ids. Unknown YAML keys are an error. `agents`, `commands`, or `templates` set true on a non-opencode harness is an error.

Boolean keys default to false. `mode` defaults to unset. `skills` and `extensions` default to empty lists. A profile install also vendors `extensions` when the dest harness is `pi`. `--extension` names install on top of that list.

## Playbooks

`playbooks/` is the library. Install copies the selected files into `{mode}-mode/playbooks/` and rewrites that skill's matching list.

| Value | Install |
| ------- | --------- |
| key omitted | The mode skill's bundled playbooks stay as copied from source |
| `all` | Every `playbooks/*.md` except README |
| list of ids | Those files, including an empty list |

`--playbooks a,b` replaces the profile selection. `--with-playbooks` and `--without-playbooks` add or remove ids after that.

Playbook files live at `playbooks/<id>.md` with `title` and `when` frontmatter. A profile names the ids it ships, or sets `playbooks: all`. Install overwrites copies inside a mode skill from the library.
