---
id: "purpose-installer"
title: "Installer purpose"
kind: purpose
description: "Copy a committable vendor tree into a dest so the dest never depends on this checkout."
status: active
domain: pack
area: installer
tags: [purpose]
created_at: "2026-08-23"
updated_at: "2026-08-26"
---

# Installer purpose

## Job

Install a self-contained vendor tree a dest project can commit and run without this checkout.

```ts
// packages/installer/src/extensions.ts — vendorPackageSource
export function vendorPackageSource(name: FirstPartyExtension): string {
  return `vendor/@agentic-core/${name}`;
}
```

## In scope

- Install from this repo only
- Profile install with that profile's `packages` list
- One extension install with `--extension`
- Repeatable `--extension`
- Dest always `.pi/`
- Vendor copy of each named first-party package
- Vendor copy at `.pi/vendor/@agentic-core/<name>`
- Dest-relative paths written into dest settings
- Overwrite of the vendor copy on re-run
- Merge of third-party `npm:` sources the way they merge today
- Copy of agents, skills, playbooks, and prompts the way they copy today

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
- Decisions: [[0002-standalone-vendor-install]], [[0005-pi-only-dest]], and [[0008-todo-owns-checklist-store]]
- Layout: [[architecture-pack-and-packages]]

## Open product questions

- (none)
