---
name: principals
description: Project judgment principles. Use when sizing a diff, placing a boundary, proving a change, choosing a data shape, deciding whether to stop, or writing RLS.
metadata:
  version: "1.0.0"
---

# Principals

Judgment rules for diffs, proof, boundaries, and when to stop. Read this router. Pick 1-N ids. `Read` only those `rules/<id>.md` files.

## Discover first

1. Name the decision (diff size, data shape, proof, stop, boundary, product rule).
2. A vault, purpose, or `behaviour-contracts` skill wins on product facts. These rules flip the design choice. They do not restate those skills.
3. Product rules apply only when the repo uses those names (Personal/Share, react-api, vault promises).

## Stack caveats

**Prefer:** smallest change, delete first, prove on the real surface, encode the domain in a structure, guards at the boundary, illegal states unrepresentable.

**Careful:** `principle-never-block-on-the-human` vs `principle-intent-ladder-stop`. Execution proceeds. Product direction stops. `principle-make-operations-idempotent` is right for reset and seeds. Dangerous if it resurrects retired sync. `principle-outcome-oriented-execution` and `principle-redesign-from-first-principles` must not rewrite a locked promise.

**Do not introduce:** a product rule when the ladder is empty. A client allow-list as authz. A shared-engine home for domain rows.

## When to apply

Sizing a diff, refactor, or new layer. Choosing types, boundaries, or a data shape. Debugging, proving a change, stacking commits. Tempted to ask the human, or to invent a product rule. Access control, sharing, or a blank list after schema drift.

## Priority bands

| Pri | Category | Impact | Read these first |
| ----- | ---------- | -------- | ------------------ |
| 1 | Stop and prove | CRITICAL | `principle-intent-ladder-stop` `principle-prove-it-works` `principle-fix-root-causes` |
| 2 | Smallest change | CRITICAL | `principle-laziness-protocol` `principle-subtract-before-you-add` |
| 3 | Security and home | CRITICAL | `principle-rls-is-the-security-boundary` `principle-personal-home-shared-bridge` |
| 4 | Domain | HIGH | `principle-model-the-domain` `principle-boundary-discipline` `principle-type-system-discipline` |
| 5 | Encode and sequence | HIGH | `principle-encode-lessons-in-structure` `principle-build-the-lever` `principle-sequence-verifiable-units` |
| 6 | Autonomy | HIGH | `principle-never-block-on-the-human` `principle-guard-the-context-window` |
| 7 | Ops and design | MEDIUM | `principle-migrate-callers-then-delete-legacy-apis` `principle-make-operations-idempotent` `principle-separate-before-serializing-shared-state` `principle-foundational-thinking` `principle-redesign-from-first-principles` `principle-outcome-oriented-execution` |
| 8 | Product pack | MEDIUM | `principle-react-api-owns-shared-behaviour` `principle-occurrences-project-never-materialize` `principle-zod-degrades-never-blanks` `principle-contracts-have-two-altitudes` |
| 9 | Craft | LOW | `principle-minimize-reader-load` `principle-experience-first` `principle-exhaust-the-design-space` |

Bands 3 and 8 only when the repo has those names. Prefer higher bands when reviewing or refactoring.

## Quick reference

**Stop and prove.** `principle-intent-ladder-stop` empty ladder means stop · `principle-prove-it-works` real surface, not typecheck · `principle-fix-root-causes` reproduce, then fix the cause

**Smallest change.** `principle-laziness-protocol` delete, flatten, smallest diff · `principle-subtract-before-you-add` remove dead weight, then build

**Security and home.** `principle-rls-is-the-security-boundary` SQL policy, not a hidden field · `principle-personal-home-shared-bridge` Personal owns rows, Shared holds Shares

**Domain.** `principle-model-the-domain` structure over scattered branches · `principle-boundary-discipline` parse at the edge · `principle-type-system-discipline` illegal states cannot compile

**Encode and sequence.** `principle-encode-lessons-in-structure` lint or type, not a second reminder · `principle-build-the-lever` the rerunnable file is the artifact · `principle-sequence-verifiable-units` one unit, one check

**Autonomy.** `principle-never-block-on-the-human` do reversible work, then present · `principle-guard-the-context-window` bulk to a subagent

**Ops and design.** `principle-migrate-callers-then-delete-legacy-apis` one wave · `principle-make-operations-idempotent` second run converges · `principle-separate-before-serializing-shared-state` own files first · `principle-foundational-thinking` data shape first · `principle-redesign-from-first-principles` as if day one · `principle-outcome-oriented-execution` target over shims

**Product pack.** `principle-react-api-owns-shared-behaviour` one hook, three skins · `principle-occurrences-project-never-materialize` project, do not copy · `principle-zod-degrades-never-blanks` warn and return rows · `principle-contracts-have-two-altitudes` behaviour vs presentation

**Craft.** `principle-minimize-reader-load` fewer layers and less hidden state · `principle-experience-first` delight over convenience · `principle-exhaust-the-design-space` 2-3 prototypes before commit

## How to use

1. Pick 1 to N rule ids. Higher priority first.
2. `Read` only `rules/<id>.md` (relative to this skill directory).
3. Do not bulk-read `rules/` or load all of `AGENTS.md` unless stuck or asked.
4. Name each rule that changed a decision and the choice it changed.

```text
rules/principle-laziness-protocol.md
rules/principle-prove-it-works.md
```

## Full reference

Catalog notes and skip rationale: `AGENTS.md` (reference only; prefer `rules/` + this router).
