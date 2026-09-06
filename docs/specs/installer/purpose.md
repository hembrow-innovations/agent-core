---
id: "purpose-installer"
title: "Installer purpose"
kind: purpose
description: "Copy profile-selected skills, agents, and prompts into dest .opencode/ so the dest never depends on this checkout."
status: active
domain: pack
area: installer
tags: [purpose]
created_at: "2026-08-23"
updated_at: "2026-09-06"
---

# Installer purpose

## Job

Install a profile's skills, agents, and prompts into a dest OpenCode tree the dest can commit without this checkout.

## In scope

- Install from this repo only
- Profile install of skills, agents, and prompts
- Dest always `.opencode/`
- Overwrite of listed dest files on re-run
- Never prune dest extras

## Out of scope

- Uninstall
- npm publish
- First-party Pi plugins
- A curl entry such as `curl | node scripts/install.mjs`
- A dest other than `.opencode/`
- A profile key that names a dest
- Copy of playbooks or `ai/system-prompts/`
