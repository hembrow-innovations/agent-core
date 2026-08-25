---
id: "glossary"
title: "Glossary"
kind: overview
description: "Names for the source pack, dest copy, and the install path between them."
domain: system
area: overview
tags: [glossary]
created_at: "2026-08-23"
updated_at: "2026-08-26"
---

# Glossary

The language of this checkout. Source pack, dest copy, and the install path between them.

## Language

**Pack**:
The source tree in this checkout. Agent, skill, playbook, and prompt libraries live under `ai/`. The Pi runtime pack lives in `ai/pi/`. Profiles stay at the root. Checks live in `scripts/`. Profile parse lives in `packages/installer`. First-party packages live under `packages/`. It is the only install source.
_Avoid_: monorepo-of-skills

**Dest**:
A project that holds a committed, self-contained copy of pack output. It has no runtime link back to this checkout.
_Avoid_: live path

**Profile**:
A named install set in `profiles/`. Selected with `--profile`. Skills, playbooks, agents, prompts, and packages. Dest is always `.pi/`. Schema: [[schema-profile]].

**Workspace package**:
A TypeScript package under `packages/`. Folders are `draconic-todo`, `draconic-coms`, `draconic-boot`, `draconic-teams`, `draconic-footer`, and `installer`.

**First-party extension**:
A product extension among the workspace packages. The five are `@agentic-core/draconic-todo`, `@agentic-core/draconic-coms`, `@agentic-core/draconic-boot`, `@agentic-core/draconic-teams`, and `@agentic-core/draconic-footer`.
_Avoid_: loose extension file

**Vendor copy**:
The committed extension copy at `.pi/vendor/@agentic-core/<name>`.

**Installer**:
The CLI in `packages/installer`, invoked as `pnpm exec agentic-core install`.
_Avoid_: curl install

**This-checkout Pi**:
The gitignored `.pi/` dest in this repo. It is not auto-wired to `packages/`.

**Coms**:
The living-session mailbox in `@agentic-core/draconic-coms`. Bind, stamp, send, get, await. Architecture: [[architecture-draconic-coms]].
_Avoid_: second mailbox, PI_* project flags

**Session checklist**:
The per-session file at `.draconic/sessions/<sessionId>/TODO.md`. `draconic_todo` writes it. The stub `.draconic/TODO.md` is not the live list. Architecture: [[architecture-draconic-todo]].
_Avoid_: playbook checklist in `.draconic/TODO.md`

**TUI footer**:
The one-line status `draconic-footer` paints in TUI mode. Architecture: [[architecture-draconic-footer]].
_Avoid_: default Pi footer

## Agent identity

**Agent definition**:
A Pi markdown file under `ai/agents/` that names identity, behaviour, and constraints. Dest holds it at `.pi/agents/`.
_Avoid_: persona, preset, OpenCode agent, role

**Primary switch**:
The process-local control that appends one agent definition to the Pi system prompt. A new process attaches nothing. The last pick does not persist.
_Avoid_: /draconic-mode, APPEND_SYSTEM, sticky primary, default agent

**Opt-in agent**:
A dest `.pi/agents/` file boot appends only after `/agent` or `--agent`.
_Avoid_: default agent, sticky primary, APPEND_SYSTEM

**Team**:
A lead Pi session plus named living TUI peers that talk on coms and share tasks. Spec: [[spec-tmux-agent-teams]].
_Avoid_: swarm, nicobailon fan-out

**Teammate**:
A living TUI `pi` in a team. The human can type into it.
_Avoid_: child, subagent

**Child**:
A nicobailon `subagent` process. Parent-owned, not a TUI, exits when the task ends.
_Avoid_: teammate, in-process child

**Skill catalog**:
The short name and description list Pi injects every turn.
_Avoid_: skill load

**Skill load**:
Reading a skill's `SKILL.md` into the transcript.
_Avoid_: catalog
