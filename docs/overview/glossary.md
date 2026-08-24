---
id: "glossary"
title: "Glossary"
kind: overview
domain: system
area: overview
tags: [glossary]
created_at: "2026-08-23"
updated_at: "2026-08-25"
---

# Glossary

The language of this checkout. Source pack, dest copy, and the install path between them.

## Language

**Pack**:
The source tree in this checkout. Harness markdown lives under `ai/`. Profiles stay at the root. First-party packages live under `packages/`. It is the only install source.
_Avoid_: monorepo-of-skills

**Dest**:
A project that holds a committed, self-contained copy of pack output. It has no runtime link back to this checkout.
_Avoid_: live path

**Profile**:
A named install set in `profiles/`. Selected with `--profile`.

**Harness**:
The dest agent runtime. One of `opencode`, `claude`, `pi`, or `agents`. `--harness` overrides the profile.

**Workspace package**:
A TypeScript package under `packages/`. Folders are `draconic-todo`, `draconic-coms`, `draconic-boot`, `draconic-teams`, `lib`, and `installer`.

**First-party extension**:
A product extension among the workspace packages. The four are `@agentic-core/draconic-todo`, `@agentic-core/draconic-coms`, `@agentic-core/draconic-boot`, and `@agentic-core/draconic-teams`.
_Avoid_: loose extension file

**Vendor copy**:
The committed, lib-bundled extension at `.pi/vendor/@agentic-core/<name>`.

**Installer**:
The CLI in `packages/installer`, invoked as `pnpm exec agentic-core install`.
_Avoid_: curl install

**Lib bundle**:
The install-time copy of `packages/lib` inside each vendor copy. Dest has no sibling lib package.

**This-checkout Pi**:
The gitignored `.pi/` dest in this repo. It is not auto-wired to `packages/`.

## Agent identity

**Agent definition**:
A Pi markdown file under `ai/pi/agents/` that names identity, behaviour, and constraints. Dest copies it to `.pi/agents/`.
_Avoid_: persona, preset, OpenCode agent, role

**Primary switch**:
The process-local control that appends one agent definition to the Pi system prompt. A new process attaches the default definition. The last pick does not persist.
_Avoid_: /draconic-mode, APPEND_SYSTEM, sticky primary

**Default agent definition**:
The dest `.pi/agents/` file boot appends on a new Pi process.
_Avoid_: APPEND_SYSTEM, last switch

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
