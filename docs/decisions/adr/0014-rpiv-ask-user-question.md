---
id: "adr-14"
title: "ADR-0014: pin @juicesharp/rpiv-ask-user-question"
kind: adr
description: "Dest Pi gets a structured questionnaire tool from pinned npm:@juicesharp/rpiv-ask-user-question@2.8.0."
status: accepted
domain: packages
area: decisions
tags: [packages, installer]
created_at: "2026-08-31"
updated_at: "2026-08-31"
---

# ADR-0014: pin @juicesharp/rpiv-ask-user-question

## Context

The model otherwise guesses when a requirement is underspecified. `@juicesharp/rpiv-ask-user-question@2.8.0` registers `ask_user_question`: a tabbed TUI questionnaire (RPC hosts fall back to `ui.select` / `ui.input`). It is MIT TypeScript source, no install scripts, no network, no eval, no native addons. Runtime deps are `@juicesharp/rpiv-config@^2.8.0` (JSON load/save under XDG; this package only reads) and `typebox` (already in this tree).

A 2.8.0 tarball review passed. Residual risk is supply chain: 122 versions, no npm provenance, caret on `rpiv-config`. Same pin rule as [[0012-inobit-pi-todo]].

## Decision

Profiles list `npm:@juicesharp/rpiv-ask-user-question@2.8.0`. Do not float the version. Do not install the rest of `@juicesharp/rpiv-*`. Do not install optional peer `@juicesharp/rpiv-i18n`.

## Alternatives considered

Ship a first-party questionnaire. That is a TUI we would still own.

Leave the version unpinned. A later 2.x publish would load on next Pi npm install without a re-review.

Install the broader `rpiv-*` set. `rpiv-web-tools`, `rpiv-args`, `rpiv-voice`, and `rpiv-workflow` are a different threat model.

## Consequences

Agents call `ask_user_question` instead of guessing. Re-review the npm tarball and `@juicesharp/rpiv-config` on any version bump. External editor is Pi's own `SettingsManager.getExternalEditorCommand()` with `projectTrusted`.

## Relationships

- [[0012-inobit-pi-todo]]
- [[architecture-pack-and-packages]]
- [[schema-profile]]
- [[glossary]]
