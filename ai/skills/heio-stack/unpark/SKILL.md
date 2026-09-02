---
name: unpark
description: Unpark heio-boot parked tools with dest_activate_tools before using them. Use when you need subagent, subagent_wait, web_search, fetch_content, or another parked third-party tool, when spawn would skip as missing, or when another skill needs a parked tool.
---

# Unpark

heio-boot parks fat third-party tools at session start. They stay registered. `dest_activate_tools` is the unpark path. Activated tools are callable on the **next** turn.

## Steps

1. Name the tools this turn needs.
2. If any named tool is not in the active tools, call `dest_activate_tools` with those names and end the turn. Done when the loader returns `Activated: …` or `No valid tool names given.`
3. On the next turn, use the tools.

Treat a silent gap in the active list as parked. Play in-session only when activate returns no valid names (not registered). Mark `skip: no spawn runtime` in that case.

## Names

- **subagent**, **subagent_wait** — pi-subagents. Activate both when the parent will wait.
- **web_search**, **fetch_content**, **source_check**, **get_search_content** — pi-web-access
- lens, ast-grep, and lsp tools — prefer `pi_lens_activate_tools`

`dest_activate_tools` stays active. Activation is additive for this session. A new session parks again.
