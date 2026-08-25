---
id: "spec-pi-agent-system"
title: "Pi agent system"
kind: spec
description: "Identity files, primary switch, team mode on coms, and selective skill load for Pi."
status: draft
domain: agents
area: agents
tags: [spec, pi]
created_at: "2026-08-24"
updated_at: "2026-08-25"
---

# Pi agent system

## Goal

Define how a Pi session gets an identity, how a team of living sessions works, and how skills and playbooks enter context.

## Requirements

Pi only.

Identity is a markdown file under `ai/agents/`. Dest holds it at `.pi/agents/`. The file may name skills, tools, and model. The body is Pi-safe.

`draconic-boot` is the switch. It appends the chosen file with `before_agent_start`. A command or `--agent` flag picks the name for this process. A new process attaches nothing. The last pick is not restored. See [[0007-agent-attach-is-opt-in]].

`draconic-coms` stamps a second identity: `You are coms peer <cname> on project <project>.` That is how a session knows `--project` and `--cname`. Those flags are not in `PI_*` and not in the boot file. A new process without the flags binds as `agent-<id>` on project `default`. Resume without the flags does the same. Bind failure stamps `coms is not bound.`

A lone session and a teammate share one file format and one attach meaning. Append. Spawn and switch differ only in how they name the file. Nicobailon children keep their own format.

A team is a lead plus named living TUI peers. They talk on coms. They share tasks. The human can type into a member. Team UX follows Claude Code agent teams. The mailbox is still coms. Not `~/.claude` inboxes. Not `claude-code-teams-mcp`. Tmux spawn and panes are a separate build. Do not staff teammates with `--mode json -p` or `--mode rpc`.

`APPEND_SYSTEM` points at a short playbook index. The session reads one matched playbook. It may read multiple **principals** rule files. Skill descriptions may stay in the catalog. Skill bodies load on demand. The dest `playbooks` router is not dumped into the transcript.

`tools` on a definition is an allowlist of builtin tools. Boot snapshots the live set, keeps active extension tools, and unions those with the listed builtins. Off or a new process restores the snapshot or the default. Never pass `definition.tools` to `setActiveTools` unchanged.

Quality is proven by evals and tests on the real Pi session.

## Non-goals

- A dest other than `.pi/`
- Wrapping Claude Code's MCP or its file inbox
- Company OS and RPC teammates
- Official presets or an open-agents fork
- A new switcher package
- Replacing nicobailon children

## Behaviour

Cold start. Boot appends nothing. The chip shows `off`.

Coms still binds. Without `--cname` and `--project` the name is `agent-<id>` and the project is `default`.

Switch. The command appends a dest file for this process. Off and default clear it. The next turn has no pack identity.

Teammate spawn. The same file format is appended. `--system-prompt` does not replace the default coding-assistant prompt as the identity path.

Tool bind. Unknown names are dropped. If no valid builtin names remain, the live set is left alone. Extension tools with `sourceInfo.source` other than `builtin` stay active.

Load. At most one playbook body is in context. Principals rules may be several. Unread rules are not a failed step unless the playbook names them.

## Acceptance

- A new Pi process in a trusted folder attaches no dest `.pi/agents/` file. `/agent` and `--agent` are the only attach path. The last switch is not restored. `APPEND_SYSTEM` is not a persona
- `/agent` or the boot command changes the appended file for this process only
- A teammate pane can receive coms and still has coms tools after a `tools` allowlist
- A multi-step task reads the playbook index and one playbook, not dest `playbooks/SKILL.md` in full
- Evals and tests fail if those bars regress

## Open questions

None.
