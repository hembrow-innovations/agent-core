---
id: "purpose-hivemind"
title: "Hivemind purpose"
kind: purpose
description: "Out-of-session predicate machine that matches file contracts and spawns short-lived lane processes."
status: active
domain: hivemind
area: hivemind
tags: [purpose]
created_at: "2026-09-01"
updated_at: "2026-09-01"
---

# Hivemind purpose

## Job

Let a dest project walk away from a trusted folder and still make progress: a program watches typed markdown, reads YAML front matter only, and starts short-lived agent processes under lane config. Quality is gates on disk, not a smarter boss.

## In scope

- Optional framework install via profile `frameworks:`
- Project-root `hivemind.yaml` as the only runtime lane contract
- `watch` and `once` process models
- Front-matter parse, per-folder schema, fail-closed quarantine
- Lane match, CAS claim, cmd-template spawn, backoff
- A heio-stack template the user may copy and edit

## Out of scope

Hard fences. The things an agent will invent if you leave them unsaid.

- Another in-session chat agent, slash-command, or Pi extension
- A resident brain that plans in a loop
- Supervisor reading markdown bodies (intent, spec prose, rationale)
- Built-in Doctor, Mint, visual QA, E2E, or skill-fixer lanes
- Typed adapter modules (Pi/Claude/OpenCode as code)
- Overlay merge of a default pack onto dest yaml
- Exclusive path audit, required worktrees, OS sandbox
- Secrets files or vaults
- Unsealing failed work
- Intent as a program oracle
- A dest other than `.pi/` for the program copy

## Surfaces

- Source: `frameworks/hivemind/`
- Dest program: `.pi/frameworks/hivemind/`
- Dest config: project-root `hivemind.yaml`
- CLI: `hivemind watch` and `hivemind once`

## Authority

- Behaviour: [[spec-hivemind]]
- Internals: [[system-design-hivemind]]
- Config: [[schema-hivemind]]
- Decisions: [[0015-hivemind-is-a-framework]], [[0016-profiles-are-directories]]
- Install: [[spec-installer]], [[schema-profile]]

## Open product questions

- (none)
