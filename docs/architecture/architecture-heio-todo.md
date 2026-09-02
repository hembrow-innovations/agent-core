---
id: "architecture-heio-todo"
title: "Todo checklist store"
kind: architecture
description: "This pack does not ship a todo store. Session todos are pinned @inobit/pi-todo. First-party heio-todo is parked."
domain: pack
area: architecture
tags: [architecture, todo]
created_at: "2026-08-26"
updated_at: "2026-08-31"
---

# Todo checklist store

## Overview

Parked under `deprecated/packages/heio-todo`. Not in the workspace. Not installed by any profile.

Session checklists are `@inobit/pi-todo@0.1.1`. The tool is `todo`. The command is `/todos`. State lives in tool-result `details` on the session branch. There is no project file.

`.heio/TODO.md` is a leftover stub if it exists. It is not the live list. Do not write a playbook checklist there. See [[0012-inobit-pi-todo]].

## Context

`@agentic-core/heio-todo` used to own `.heio/sessions/<sessionId>/TODO.md` and block builtin writes to those paths. That cluttered the tracker. The store had moved into the todo package so dest copies stayed self-contained and `packages/lib` could die. See [[0008-todo-owns-checklist-store]].

## Design

Profiles list `npm:@inobit/pi-todo@0.1.1`. Install does not copy a first-party todo tree. Profile install removes leftover `.pi/npm/local/@agentic-core/heio-todo` and `.pi/npm/node_modules/@agentic-core/heio-todo` the same way it removes parked `heio-coms` and `heio-teams`.

Agents must not keep both `todo` and `heio_todo`.

There is still no `packages/lib`.

## Trade-offs

We do not maintain a todo extension. Version bumps of `@inobit/pi-todo` need a tarball re-read. Path protection of `.heio/TODO.md` is gone; prompts still forbid writing a playbook list there.

## Consequences

`--extension heio-todo` is an unknown extension. First-party `--extension` names are `heio-boot`, `heio-footer`, and `heio-onic`.

Terms live in [[glossary]].
