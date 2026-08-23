---
id: "glossary"
title: "Glossary"
kind: overview
domain: system
area: overview
tags: [glossary]
created_at: "2026-08-23"
updated_at: "2026-08-23"
---

# Glossary

The language of this checkout. Source pack, dest copy, and the install path between them.

## Language

**Pack**:
The source tree in this checkout. Skills, playbooks, profiles, and first-party packages live here. It is the only install source.
_Avoid_: monorepo-of-skills

**Dest**:
A project that holds a committed, self-contained copy of pack output. It has no runtime link back to this checkout.
_Avoid_: live path

**Profile**:
A named install set in `profiles/`. Selected with `--profile`.

**Harness**:
The dest agent runtime. One of `opencode`, `claude`, `pi`, or `agents`. `--harness` overrides the profile.

**Workspace package**:
A TypeScript package under `packages/`. Folders are `draconic-todo`, `draconic-coms`, `draconic-boot`, `lib`, and `installer`.

**First-party extension**:
A product extension among the workspace packages. The three are `@agentic-core/draconic-todo`, `@agentic-core/draconic-coms`, and `@agentic-core/draconic-boot`.
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
