---
id: "adr-15"
title: "ADR-0015: Hivemind is an optional framework"
kind: adr
description: "Out-of-session supervisor lives under frameworks/, installs via profile frameworks:, dest copy is .pi/frameworks/. Not a Pi package."
status: accepted
domain: hivemind
area: decisions
tags: [hivemind, installer]
created_at: "2026-09-01"
updated_at: "2026-09-01"
---

# ADR-0015: Hivemind is an optional framework

## Context

This pack already has in-session gates ([[architecture-pack-and-packages]], `@agentic-core/heio-coord`) and parked in-session orchestrators (tmux team-lead, AFK orchestrator). Those are chat bosses. The wanted product is a **predicate machine outside a session**: watch files, read front matter, spawn short-lived children, die or sleep.

Product TypeScript today lives under `packages/` and install copies it into `.pi/npm/local/` as a Pi extension. Putting Hivemind there would load a daemon into the session plugin list. Folding it into coord mixes a live-session gate with an out-of-session process.

Dest is always `.pi/` ([[0005-pi-only-dest]]). Project conventions still need a committed file the reinstall of `.pi/frameworks/` cannot eat.

## Decision

Hivemind is a **framework**, not a workspace package and not a Pi extension.

- Source lives at `frameworks/hivemind/` in this checkout.
- Profile YAML may list `frameworks: [hivemind]`. Missing key means no framework.
- Install writes `.pi/frameworks/hivemind/` (`package.json` + non-test `src/`). Reinstall overwrites that tree. It is not merged into `.pi/settings.json` `packages`.
- Runtime config is project-root `hivemind.yaml`. First install copies the profile template there **only if missing**. Reinstall never overwrites it. Runtime fail-closed if the file is absent.
- Entry is a CLI in that tree: `watch` and `once`. Not a Pi slash-command.

Project-root `hivemind.yaml` is project convention (like `AGENTS.md`), not dest pack. [[0005-pi-only-dest]] still holds for the program copy.

## Alternatives considered

A workspace package under `packages/` copied to `.pi/npm/local/`. Coord-shaped. The supervisor would look like a session plugin.

A separate repo. Splits schema, glossary, and installer from the pack that must ship the template.

Fold into `heio-coord`. Different process, failure domain, and user.

Always-on dest copy without a profile key. Projects that do not want walk-away spawn would still receive the binary.

Runtime overlay of a shipped default pack onto dest yaml. Hidden defaults. Replaced by a user-owned full file plus a template ([[0016-profiles-are-directories]]).

## Consequences

Installer grows a `frameworks:` key and a dest tree besides npm/local. Profiles that omit the key stay session-only.

`frameworks/` is a fifth source tree next to `ai/`, `packages/`, dest `.pi/`, and `.pi/npm/local/`.

Pi never loads Hivemind as an extension. Killing the Hivemind process stops spawn. Killing Pi does not.

Lane config survives reinstall. The program does not.

## Relationships

- [[0005-pi-only-dest]]
- [[0016-profiles-are-directories]]
- [[architecture-pack-and-packages]]
- [[schema-profile]]
- [[purpose-hivemind]]
- [[spec-hivemind]]
- [[system-design-hivemind]]
- [[schema-hivemind]]
- [[glossary]]
