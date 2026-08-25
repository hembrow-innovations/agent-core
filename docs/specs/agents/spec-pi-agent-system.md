---
id: "spec-pi-agent-system"
title: "Pi agent system"
kind: spec
description: "Dest agent files, opt-in attach, tool allowlist, and the second coms stamp."
status: draft
domain: agents
area: agents
tags: [spec, pi]
created_at: "2026-08-24"
updated_at: "2026-08-26"
---

# Pi agent system

## Goal

Define how a Pi process attaches a dest agent file, how that file is parsed, and how its `tools` list changes the live builtin set. Team panes and skill load stay in scope as product rules. Boot does not implement them.

## Requirements

Pi only.

Source identity files live under `ai/agents/<stem>/<stem>.md`. Dest holds the same stem at `.pi/agents/<stem>.md`. `agentFile` is the dest path boot reads.

```ts
// packages/draconic-boot/src/index.ts — agentFile
function agentFile(cwd: string, name: string): string {
  return join(cwd, ".pi", "agents", `${name}.md`);
}
```

The file is YAML frontmatter plus a Pi-safe body. Allowed keys are `name`, `skills`, `tools`, and `model`. `parseAgentDefinition` throws on unknown keys, a missing or empty name, a name that fails `^[a-z][a-z0-9-]{0,63}$`, missing fences, or an empty body. Pack files in `ai/agents/` parse today with `name` only. Some name `skills`. None name `tools`.

`draconic-boot` is the switch. `registerFlag("agent")` is the process flag. `/agent` is the command. `before_agent_start` appends `def.body` when a stem is selected. A new process attaches nothing. The last pick is not written to disk. See [[0007-agent-attach-is-opt-in]].

`draconic-coms` stamps a second identity. Boot does not own that stamp, `--project`, or `--cname`. See [[architecture-draconic-coms]].

A lone session and a teammate share one dest file format and one attach meaning. Append. How a pane is named is not this spec. Nicobailon children keep their own format.

A team is a lead plus named living TUI peers on coms. Tmux spawn is a separate build. Do not staff teammates with `--mode json -p` or `--mode rpc`.

`tools` on a definition is an allowlist of builtin tool names. `bindActiveTools` snapshots the live set, keeps active extension tools, and unions those with the listed builtins. Off restores the snapshot. Never pass `definition.tools` to `setActiveTools` unchanged.

`skills` and `model` parse into `AgentDefinition`. Boot does not load skills or set the model from those fields.

Quality is proven by tests in `packages/draconic-boot/src/*.test.ts` and by evals on a real Pi session.

## Non-goals

- A dest other than `.pi/`
- Wrapping Claude Code's MCP or its file inbox
- Company OS and RPC teammates
- Official presets or an open-agents fork
- A new switcher package
- Replacing nicobailon children
- Persisting the last `/agent` pick
- Applying `skills` or `model` at attach time

## Behaviour

### Cold start

`selected` starts as `null`. `session_start` reads `--agent` through `flagString`. It sets `selected` only when `loadAgent` returns a definition. A missing dest file or a parse throw is `undefined`. The chip is `off`. `before_agent_start` returns nothing. The base system prompt is unchanged.

```ts
// packages/draconic-boot/src/index.ts — session_start
pi.on("session_start", (_event, ctx) => {
  const flagged = flagString(pi, "agent");
  if (flagged && loadAgent(ctx.cwd, flagged)) selected = flagged;
  applyDefinition(ctx, loadCurrent(ctx.cwd));
});
```

`loadAgent` swallows parse errors. It does not crash the session.

```ts
// packages/draconic-boot/src/index.ts — loadAgent
function loadAgent(cwd: string, name: string): AgentDefinition | undefined {
  const path = agentFile(cwd, name);
  if (!existsSync(path)) return undefined;
  try {
    return parseAgentDefinition(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
}
```

Tests: `session_start paints off when no agent is selected`, `before_agent_start does not append when no agent is selected`, `boot writes no dest flag file`.

### Switch

`/agent <stem>` loads that dest file for this process. `/agent`, `/agent off`, and `/agent default` call `selectNone`. The chip is `off`. The next `before_agent_start` does not append.

An unknown stem notifies `unknown agent: <stem>` and keeps the current file. `/agent` writes no dest settings and no flag file.

```ts
// packages/draconic-boot/src/index.ts — before_agent_start
pi.on("before_agent_start", (event, ctx) => {
  const def = loadCurrent(ctx.cwd);
  applyDefinition(ctx, def);
  if (!def) return;
  return {
    systemPrompt: `${event.systemPrompt}\n\n${def.body}`,
  };
});
```

`--agent <stem>` is the same attach for this process. `session_start` ignores a missing dest file. There is no fallback to `draconic`.

Tests: `/agent other appends that file on the next turn`, `/agent default clears the agent`, `unknown /agent name keeps the current file`, `--agent flag selects that file for this process`.

### Definition parse

`parseAgentDefinition` splits on `---` fences. It keeps `name`, optional `skills`, optional `tools`, and optional `model`. Unknown keys throw `AgentDefinitionError` with code `unknown_keys`. `cname` is not a boot key.

```ts
// packages/draconic-boot/src/definition.ts — parseAgentDefinition
const NAME_RE = /^[a-z][a-z0-9-]{0,63}$/;
const ALLOWED_KEYS = new Set(["name", "skills", "tools", "model"]);
```

`name` is required. The body after the closing fence must be non-empty. Lists accept `a, b` or `[a, b]`.

Tests: `valid fixture parses to name, body, and optional lists`, `omitted optional keys stay undefined`, `empty body throws`, `unknown keys throw`, `every non-empty pack agent parses`.

### Tool bind

`applyDefinition` always calls `bindActiveTools`, then `paint`. The chip is `def.name` or `off`.

No definition, or a definition with `tools` omitted, restores `toolsSnapshot` when one exists.

When `tools` is present, the first bind snapshots `getActiveTools()`. Names that are not builtin are dropped. If no valid builtin remains, `setActiveTools` is not called. Otherwise the live set is the valid builtins plus every currently active tool whose `sourceInfo.source` is not `builtin`.

```ts
// packages/draconic-boot/src/index.ts — bindActiveTools
const valid = definition.tools.filter((name) => builtin.has(name));
if (valid.length === 0) return nextSnapshot;
const extensions = all
  .filter(
    (tool) => tool.sourceInfo.source !== "builtin" && active.has(tool.name),
  )
  .map((tool) => tool.name);
pi.setActiveTools([...new Set([...valid, ...extensions])]);
```

Tests: `tools allowlist keeps coms and subagent`, `unknown tool names do not throw`, `empty valid tools list leaves the live set`, `return-to-off restores the tools snapshot`.

### Load

Skill catalog and playbook bodies are not boot. `skills` on the definition is stored and unused at attach. `APPEND_SYSTEM` is not a persona and is not this switch.

## Acceptance

- A new Pi process attaches no dest `.pi/agents/` file. `/agent` and `--agent` are the only attach path. The last switch is not restored. `APPEND_SYSTEM` is not a persona
- `/agent` or `--agent` changes the appended file for this process only
- A missing or broken dest file is `undefined`. The session stays up. The chip stays `off` unless another stem is already selected
- A `tools` allowlist keeps active extension tools. Unknown builtin names drop. An empty valid list leaves the live set. Off restores the snapshot
- `parseAgentDefinition` rejects unknown keys and an empty body. Pack agents under `ai/agents/` parse
- Tests in `packages/draconic-boot/src/index.test.ts` and `definition.test.ts` fail if those bars regress

## Open questions

None.
