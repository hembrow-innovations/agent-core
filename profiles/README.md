# Profiles

`pnpm exec agentic-core install <target> --profile NAME` loads `profiles/NAME/profile.yaml`. Dest is always `.pi/`.

Field rules, leftover keys, and the YAML subset live in `docs/api/schema/schema-profile.md`.

```yaml
skills:
  - architect
agents:
  - architect
  - coder
prompts:
  - arena
packages:
  - npm:pi-lens
  - npm:@inobit/pi-todo@0.1.1
settings:
  toolDescriptionMode: compact
  defaultTools:
    - read
    - bash
# system-prompt: persona   # optional. copies ai/pi/<stem>.md to dest .pi/APPEND_SYSTEM.md
```

Install writes `.pi/skills` and the Pi pack into `.pi/`:

- first-party local packages from `profile.packages` into `.pi/npm/local/@agentic-core/`
- every selected `ai/prompts/*.md` except README, into `.pi/prompts/`
- `ai/pi/<stem>.md` to dest `.pi/APPEND_SYSTEM.md` when `system-prompt: <stem>` is set, else `ai/pi/APPEND_SYSTEM.md`, if that dest file is missing or a known legacy stub
- `.pi/.gitignore` if that file is missing
- package sources from `profile.packages` into `.pi/settings.json`
- `profile.settings` deep-merged into `.pi/settings.json`

A missing `ai/pi/APPEND_SYSTEM.md` is an error when the key is omitted. An unknown or missing `system-prompt` stem fails at plan time. `ai/pi/heio-models.md` is not in the pack. Install does not require or write dest `.pi/heio-models.md`. An existing dest file stays. `ai/prompts/` is optional. Identity dest is `.pi/agents/`. Install deletes leftover dest `.pi/roles/`.

The installer does not copy playbooks. Dest `.pi/playbooks/` is not pruned. `playbooks:` on a profile is a leftover-key error.

`packages:` is the install list. Install merges those sources into `.pi/settings.json` `packages` and then deep-merges `settings:`. Dest keys the profile omits stay. An existing object-form entry with the same `source` counts as present. Pi then installs any missing project packages on the next trusted startup.
