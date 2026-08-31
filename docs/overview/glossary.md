---
id: "glossary"
title: "Glossary"
kind: overview
description: "Names for the source pack, dest copy, and the install path between them."
domain: system
area: overview
tags: [glossary]
created_at: "2026-08-23"
updated_at: "2026-08-31"
---

# Glossary

The language of this checkout. Source pack, dest copy, and the install path between them.

## Language

**Pack**:
The source tree in this checkout. Agent, skill, playbook, and prompt libraries live under `ai/`. The Pi runtime pack lives in `ai/pi/`. Profiles stay at the root. Checks and repo tests live in `tests/`. `scripts/` is the npm entrypoints. Profile parse lives in `packages/installer`. First-party packages live under `packages/`. It is the only install source.
_Avoid_: monorepo-of-skills

**Repo check**:
A standalone integrity script under `tests/checks/`. Run by `pnpm test`. Not an npm entrypoint. Layout: [[architecture-verify]].
_Avoid_: scripts/checks

**Dest**:
A project that holds a committed, self-contained copy of pack output. It has no runtime link back to this checkout.
_Avoid_: live path

**Profile**:
A named install set in `profiles/`. Selected with `--profile`. Skills, agents, prompts, packages, and optional settings. Dest is always `.pi/`. Schema: [[schema-profile]].

**Workspace package**:
A TypeScript package under `packages/`. Folders are `heio-boot`, `heio-footer`, `heio-coord`, `heio-onic`, and `installer`. Parked packages live under `deprecated/packages/`.

**First-party extension**:
A product extension among the workspace packages. The four are `@agentic-core/heio-boot`, `@agentic-core/heio-footer`, `@agentic-core/heio-coord`, and `@agentic-core/heio-onic`.
_Avoid_: loose extension file

**Local first-party copy**:
The committed extension copy at `.pi/npm/local/@agentic-core/<name>`. Profile YAML marks the source as `local:@agentic-core/<name>`. Settings name the dest-relative path `npm/local/@agentic-core/<name>`. That folder is outside Pi's `.pi/npm/node_modules/` install tree.

**Installer**:
The CLI in `packages/installer`, invoked as `pnpm exec agentic-core install`.
_Avoid_: curl install

**This-checkout Pi**:
The gitignored `.pi/` dest in this repo. It is not auto-wired to `packages/`.

**Coms**:
The living-session mailbox formerly in `@agentic-core/heio-coms`. Bind, stamp, send, get, await. Parked under `deprecated/packages/heio-coms`. Architecture: [[architecture-heio-coms]].
_Avoid_: second mailbox, PI_* project flags

**Session checklist**:
The `todo` tool from pinned `@inobit/pi-todo`. State lives on the session branch. `.heio/TODO.md` is a leftover stub if it exists, not the live list. Architecture: [[architecture-heio-todo]].
_Avoid_: playbook checklist in `.heio/TODO.md`

**Questionnaire**:
The `ask_user_question` tool from pinned `@juicesharp/rpiv-ask-user-question`. Structured options instead of a free-form guess. Decision: [[0014-rpiv-ask-user-question]].
_Avoid_: unpinned `rpiv-*`, first-party questionnaire

**TUI footer**:
The one-line status `heio-footer` paints in TUI mode. Architecture: [[architecture-heio-footer]].
_Avoid_: default Pi footer

## Agent identity

**Agent definition**:
A Pi markdown file under `ai/agents/` that names identity, behaviour, and constraints. Dest holds it at `.pi/agents/`.
_Avoid_: persona, preset, OpenCode agent, role

**Primary switch**:
The process-local control that appends one agent definition to the Pi system prompt. A new process attaches nothing. The last pick does not persist.
_Avoid_: /heio-mode, APPEND_SYSTEM, sticky primary, default agent

**Opt-in agent**:
A dest `.pi/agents/` file boot appends only after `/agent` or `--agent`.
_Avoid_: default agent, sticky primary, APPEND_SYSTEM

**Team**:
A lead Pi session plus named living TUI peers that talk on coms and share tasks. Parked under `deprecated/packages/heio-teams`. Spec: [[spec-tmux-agent-teams]].
_Avoid_: swarm, nicobailon fan-out

**Teammate**:
A living TUI `pi` in a team. It is an instance of one agent definition. The human can type into it.
_Avoid_: child, subagent

**Teammate instance**:
The unique seat name on `--cname`. `builder-1` and `builder-2` are two instances of `builder`.
_Avoid_: agent, identity, role

**Member record**:
The on-disk folder `.heio/teams/<team>/roster/<cname>/`. Identity, work log, handoff, optional notes.
_Avoid_: session file, agent definition

**Handoff**:
The latest restore card for one instance. Overwritten on task complete. Injected after a clean spawn.
_Avoid_: compact summary, /new

**Work log**:
The append-only TSV index of instance events. History for review. Not loaded into the model by default.
_Avoid_: journal, session JSONL

**Child**:
A nicobailon `subagent` process. Parent-owned, not a TUI, exits when the task ends.
_Avoid_: teammate, in-process child

**Skill catalog**:
The short name and description list Pi injects every turn.
_Avoid_: skill load

**Skill load**:
Reading a skill's `SKILL.md` into the transcript.
_Avoid_: catalog

## Heio-stack

**Location**:
A destination on the roadmap. A bullet: this is working when. A file under `planning/locations/` only when it needs depth.
_Avoid_: bet (as the roadmap grain), milestone, epic

**Bet**:
An optional pivot under a location. Try X; pivot if Y. If it wins, it becomes a location or a sprint grouping.
_Avoid_: roadmap item, sprint goal

**Sprint**:
A grouping of slices and tasks. Named after a location or a timebox (`week-1`).
_Avoid_: ordered bet, force-function destination

**Archive**:
`.heio/archive/`, mirroring `planning/` and `tickets/`. Finished work moves here. `index.md` lists what landed.
_Avoid_: Done section on the live roadmap
