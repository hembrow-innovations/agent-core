---
id: "glossary"
title: "Glossary"
kind: overview
description: "Names for the source pack, dest copy, and the install path between them."
domain: system
area: overview
tags: [glossary]
created_at: "2026-08-23"
updated_at: "2026-09-02"
---

# Glossary

The language of this checkout. Source pack, dest copy, and the install path between them.

## Language

**Pack**:
The source tree in this checkout. Agent, skill, playbook, prompt, and system-prompt libraries live under `ai/`. Profiles stay at the root as directories. Checks and repo tests live in `tests/`. `scripts/` is the npm entrypoints. Profile parse lives in `packages/installer`. First-party packages live under `packages/`. Frameworks live under `frameworks/`. It is the only install source.
_Avoid_: monorepo-of-skills

**Repo check**:
A standalone integrity script under `tests/checks/`. Run by `pnpm test`. Not an npm entrypoint. Layout: [[architecture-verify]].
_Avoid_: scripts/checks

**Dest**:
A project that holds a committed, self-contained copy of pack output. It has no runtime link back to this checkout.
_Avoid_: live path

**Profile**:
A named install set. `--profile <name>` loads `profiles/<name>/profile.yaml`. Skills, agents, prompts, packages, optional settings, optional frameworks, optional `system-prompt`. Dest pack is always `.pi/`. Schema: [[schema-profile]]. Decision: [[0016-profiles-are-directories]].
_Avoid_: flat `profiles/<name>.yaml`

**System prompt**:
Markdown under `ai/system-prompts/<stem>.md`. Profile `system-prompt:` copies that file to dest `.pi/APPEND_SYSTEM.md`. Omit the key and install copies `default.md`. Dest filename is Pi's append file. It is not a persona.
_Avoid_: persona, ai/pi, default agent

**Workspace package**:
A TypeScript package under `packages/`. Folders are `heio-boot`, `heio-footer`, `heio-onic`, and `installer`. Parked packages live under `deprecated/packages/`.

**First-party extension**:
A product extension among the workspace packages. The three are `@agentic-core/heio-boot`, `@agentic-core/heio-footer`, and `@agentic-core/heio-onic`.
_Avoid_: loose extension file

**Local first-party copy**:
The committed extension copy at `.pi/npm/local/@agentic-core/<name>`. Profile YAML marks the source as `local:@agentic-core/<name>`. Settings name the dest-relative path `npm/local/@agentic-core/<name>`. That folder is outside Pi's `.pi/npm/node_modules/` install tree.

**Installer**:
The CLI in `packages/installer`, invoked as `pnpm exec agentic-core install`.
_Avoid_: curl install

**This-checkout Pi**:
The gitignored `.pi/` dest in this repo. It is not auto-wired to `packages/`.

**Framework**:
An out-of-session TypeScript program under `frameworks/<name>/`. Profile `frameworks:` copies it to `.pi/frameworks/<name>/`. Not a Pi extension. Decision: [[0015-hivemind-is-a-framework]].
_Avoid_: workspace package, first-party extension

**Hivemind**:
The first framework. A predicate machine that matches front matter and spawns short-lived lane processes. Purpose: [[purpose-hivemind]].
_Avoid_: orchestrator, afk-orchestrator, coord, in-session boss

**Lane**:
A named plugin in `.hivemind/hivemind.yaml`: type, trigger, per-lane concurrency, cmd template or pipeline stages, claim-status. A `single` lane is one child life. A `pipeline` is ordered stages on one claim.
_Avoid_: agent definition, teammate, adapter module

**Actor**:
Reusable spawn identity for Hivemind lanes (`cmd`, `agent`, `prompt`, `scope`, `claim-status`). Defined in `.hivemind/hivemind.yaml` `actors:` and/or `.hivemind/actors/*.yaml`. The main yaml overlays files.
_Avoid_: agent definition, teammate

**Coms**:
The living-session mailbox formerly in `@agentic-core/heio-coms`. Bind, stamp, send, get, await. Parked under `deprecated/packages/heio-coms`. Architecture: [[architecture-heio-coms]].
_Avoid_: second mailbox, PI_* project flags

**Coord**:
The former in-session heio-stack gate `@agentic-core/heio-coord` (`heio_stack`, `/heio`). Parked under `deprecated/packages/heio-coord`. The tracker is skills and `.heio/` files. Architecture: [[architecture-heio-coord]]. Decision: [[0017-park-heio-coord]].
_Avoid_: required extension, heio_stack

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

**Sealed**:
The Hivemind/heio-stack rule that spec + EXPECT are immutable once written. A miss mints a new ticket. Nothing is unsealed.
_Avoid_: freeze, frozen, locked, unblocked

**Ready**:
Slice status meaning schedulable under the Hivemind template. Replaces `frozen` as a status name. Permanence is sealed, not this word.
_Avoid_: freeze, ready-for-build (as the only name)

**Ready-for-agent**:
Ticket status a Plan lane may claim. `ready-for-human` is invisible to that trigger until a human promotes it.
_Avoid_: open (as the only Plan gate)

**Quarantine**:
Typed folder (template: `.heio/quarantine/`) for notes that failed schema. Supervisor writes `origin-location`, `quarantined-at`, `fault` on the move.
_Avoid_: Doctor, format-doctor
