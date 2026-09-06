# Stacks

A stack is a product unit under `stacks/<name>/`. It comes with everything inside that folder. A profile names the stack and install copies it.

```yaml
stacks:
  - heio-stack
```

Layout inside a stack:

- **agents/**: `stacks/<name>/agents/<id>/<id>.md`
- **skills/**: `stacks/<name>/skills/<skill>/SKILL.md`
- **prompts/**: markdown under `stacks/<name>/prompts/`

Leave shared libraries in `ai/`. Add a new stack as a new folder here. Do not mix stack files back into `ai/`.

`stacks/heio-stack` is the tracker. Profile `profiles/heio-stack` is the export cut that names this stack.
