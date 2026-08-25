# Profiles

`pnpm exec agentic-core install <target> --profile NAME` loads `profiles/NAME.yaml`. Dest is always `.pi/`.

Field rules, leftover keys, and the YAML subset live in `docs/api/schema/schema-profile.md`.

```yaml
skills:
  - architect
playbooks: all
agents:
  - architect
  - coder
prompts:
  - arena
packages:
  - npm:pi-lens
  - vendor/@agentic-core/draconic-todo
```

Install writes `.pi/skills` and the Pi pack into `.pi/`:

- first-party vendor packages from `profile.packages` into `.pi/vendor/@agentic-core/`
- every `ai/pi/prompts/*.md` except README, into `.pi/prompts/`
- `ai/pi/APPEND_SYSTEM.md` and `ai/pi/draconic-models.md` if those dest files are missing
- `.pi/.gitignore` if that file is missing
- package sources from `ai/pi/packages.json` into `.pi/settings.json`

A missing `ai/pi/APPEND_SYSTEM.md` or `ai/pi/draconic-models.md` is an error. `ai/pi/prompts/` is optional. Identity dest is `.pi/agents/`. Install deletes leftover dest `.pi/roles/`.

`ai/pi/packages.json` is a JSON array of Pi package sources such as `npm:pi-lens`. Install merges those sources into `.pi/settings.json` `packages` and leaves other settings keys alone. An existing object-form entry with the same `source` counts as present. Pi then installs any missing project packages on the next trusted startup.
