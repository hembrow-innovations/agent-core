# Profiles

`pnpm exec agentic-core install <target> --profile NAME` loads `profiles/NAME/profile.yaml`. Dest is always `.opencode/`.

Field rules, leftover keys, and the YAML subset live in `docs/api/schema/schema-profile.md`.

```yaml
stacks:
  - heio-stack
skills:
  - architect
agents:
  - architect
  - coder
prompts:
  - arena
```

`stacks:` names folders under `stacks/`. Install copies everything in that stack. Listed skills, agents, and prompts still come from `ai/` or from a stack when the name lives there.

Install writes into `.opencode/`:

- selected skills into `.opencode/skills/<name>/`
- selected agents into `.opencode/agents/<id>.md`
- selected prompts into `.opencode/commands/<id>.md`

The installer does not copy playbooks. Dest `.opencode/playbooks/` is not pruned. `playbooks:` on a profile is a leftover-key error.

`packages:`, `settings:`, `system-prompt:`, and `extensions:` are leftover Pi keys and fail at load. Pi is deprecated.

`profiles/world` is the novel vault export. Skills under `ai/skills/writing/`. Install with `--profile world` into the world dest. It is not this checkout.
