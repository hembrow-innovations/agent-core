---
title: Refactoring
impact: HIGH
impactDescription: A behavior change inside a refactor loses the pin
tags: [build]
---

## Refactoring

A behavior-preserving change to structure or shape.

**Incorrect:** Smuggle a feature or a bug fix into the reshape. Typecheck as the pin. Add a compatibility shim.

**Correct:** You own the contract. Pin behavior. Name the missing structure. Subtract, then move. Prove equivalence.

1. Characterization test, snapshot, or equivalence harness before any move.
2. Name the structure the code is missing.
3. Name the target shape. `architect` if it crosses a function boundary.
4. Subtract dead weight first.
5. Small behavior-preserving steps. Migrate callers and delete the old API in the same wave.
6. Prove on the real artifact.
7. If reader load did not drop, revert.
8. Opening a PR.

Library: `ai/playbooks/refactoring.md` (dest: `playbooks/refactoring.md`).

Notes: New behavior is `build-feature`. A cross-cutting migration is figure-it-out.
