---
id: "purpose-installer"
title: "Installer purpose"
kind: purpose
description: "Copy committable first-party packages into dest npm/local so the dest never depends on this checkout."
status: active
domain: pack
area: installer
tags: [purpose]
created_at: "2026-08-23"
updated_at: "2026-09-02"
---

# Installer purpose

## Job

Install self-contained first-party copies a dest project can commit and run without this checkout.

```ts
// packages/installer/src/extensions.ts — localPackageSource
export function localPackageSource(name: FirstPartyExtension): string {
  return `npm/local/@agentic-core/${name}`;
}
```

## In scope

- Install from this repo only
- Profile install with that profile's `packages` list
- Optional `frameworks:` list copied to `.pi/frameworks/<name>/`
- Write-if-missing dest project-root `hivemind.yaml` from the profile template
- One extension install with `--extension`
- Repeatable `--extension`
- Dest always `.pi/`
- Local copy of each named first-party package
- Local copy at `.pi/npm/local/@agentic-core/<name>`
- Dest-relative paths written into dest settings
- Overwrite of the local copy on re-run
- Never prune dest extras
- Merge of third-party `npm:` sources the way they merge today
- Copy of agents, skills, playbooks, and prompts the way they copy today
- Optional profile `system-prompt:` stem copied to dest `.pi/APPEND_SYSTEM.md`

## Out of scope

- Uninstall
- npm publish
- A `git:` package source for first-party extensions
- A curl entry such as `curl | node scripts/install.mjs`
- A dest other than `.pi/`
- A profile key that names a dest
- A meta package that installs every extension
- Skills turned into npm or Pi packages
- Auto-wire of this checkout's Pi to `packages/`
- A live path from dest back to this checkout
- First-party copy from `pi/extensions/`

## Surfaces

The CLI is `pnpm exec agentic-core install`.
The dest tree is `.pi/` plus dest settings.

## Authority

- Behaviour: [[spec-installer]]
- Profile YAML: [[schema-profile]]
- Decisions: [[0011-local-packages-in-npm-local]], [[0010-local-packages-in-npm]], [[0005-pi-only-dest]], [[0008-todo-owns-checklist-store]], [[0015-hivemind-is-a-framework]], and [[0016-profiles-are-directories]]
- Layout: [[architecture-pack-and-packages]]

## Open product questions

- (none)
