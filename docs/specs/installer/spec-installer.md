---
id: "spec-installer"
title: "Installer spec"
kind: spec
description: "CLI, dest vendor tree, settings merge, and overwrite rules for install from this repo."
status: draft
domain: pack
area: installer
tags: [spec]
created_at: "2026-08-23"
updated_at: "2026-08-25"
---

# Installer spec

## Goal

Define how `pnpm exec agentic-core install` copies a self-contained tree into a dest.

## Requirements

The command is `pnpm exec agentic-core install <target>`.

Flags:

- `--profile <name>`
- `--extension <name>`

`--extension` may repeat.
A profile install also installs that profile's `extensions` list.
Dest is always `.pi/`.

The dest receives a lib-bundled copy at `.pi/vendor/@agentic-core/<name>`.
Dest settings gain a dest-relative path to that folder.
Re-running install overwrites the vendor copy.
The dest has no sibling lib package.

Agents, skills, playbooks, prompts, and third-party `npm:` sources still merge the way they do today.
First-party extensions never copy from `pi/extensions/`.

The dest must commit `.pi/vendor/` and the settings that point at it.
This checkout is the only install source.
A dest never depends on this checkout at runtime.

## Non-goals

- Uninstall
- npm publish
- A `git:` package source for first-party extensions
- A curl entry such as `curl | node scripts/install.mjs`
- A dest other than `.pi/`
- A profile key that names a dest

## Behaviour

`<target>` is a dest directory. `.` is allowed.

`--profile <name>` writes that profile into `.pi/` and installs every name in `profile.extensions`.
`--extension <name>` installs that first-party extension into `.pi/vendor/`.
Repeated `--extension` flags install each named extension.
`--profile` and `--extension` may be used together. Extra extensions install on top of the profile list.

Install bundles `packages/lib` into each extension. Dest does not receive a vendor lib package.

The package `@agentic-core/draconic-todo` lands at `.pi/vendor/@agentic-core/draconic-todo`. The same shape holds for `draconic-coms`, `draconic-boot`, and `draconic-teams`.

The dest uses `.pi/vendor/` and `.pi/settings.json`.
Settings record dest-relative paths only. No path back to this checkout.

Third-party sources such as `npm:pi-lens` still merge into dest settings.

Re-run replaces the vendor tree and rewrites the dest-relative settings paths.

This checkout's Pi is not wired to `packages/`. Nothing vendors until the installer is pointed at a target.

A leftover `harness:`, `pi:`, `agents:`, `prompts:`, `templates:`, or `commands:` key on a profile is an error.

## Acceptance

- The command accepts `<target>`, `--profile`, and `--extension`
- `--extension` can be passed more than once
- A profile install installs `profile.extensions` into `.pi/vendor/`
- Vendor path is `.pi/vendor/@agentic-core/<name>`
- Settings contain dest-relative paths to those folders
- Re-run overwrites the vendor copy
- Third-party `npm:` sources still merge
- First-party extensions are not read from `pi/extensions/`
- `--harness` is an unknown flag
- Installer tests write a temp dest and check settings plus the vendor tree
- Dest has no live path back to this checkout
- Dest has no sibling lib package

## Open questions

- (none)
