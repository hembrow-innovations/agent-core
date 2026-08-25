---
name: playbooks
description: Match a task to a bundled playbook. Router plus one rule per playbook from ai/playbooks.
disable-model-invocation: true
---

# Playbooks

Pick one playbook. Read that rule. Then read the library file for the full steps.

## Discover first

1. Name the kind: build, fix, read, ship, run, plan, session, author.
2. Large or cross-cutting work, or a run the human reviews after stepping away, is `/figure-it-out`. Not a rule here.
3. One agent that can finish inside the session budget is not Orchestrate.

## Stack caveats

**Prefer:** one playbook per task. Copy its steps into the todolist verbatim. A skip stays as `skip: <reason>`. Dest steps live at `.pi/playbooks/<id>.md`.

**Careful:** Feature when `/figure-it-out` is the fit. Babysit when the ask is to land. Perf when the ask is a sustained metric loop. Prototype when the sketch is the ship.

**Do not introduce:** Graphite or `gt` unless the repo already uses it. A Cursor cloud fleet on Pi. A second source of truth for playbook steps. This pack does not replace `ai/playbooks/`.

## When to apply

Choosing which playbook to run. A named playbook. Ambiguous "fix this", "ship it", or "run until done". Session pause or pickup.

## Priority bands

| Pri | Category | Impact | Read these first |
| ----- | ---------- | -------- | ------------------ |
| 1 | Kind | CRITICAL | `build-feature` `fix-bug` `read-investigation` `plan-multi-phase` |
| 2 | Program | CRITICAL | `run-autonomous` `run-orchestrate` `run-hillclimb` |
| 3 | Ship | HIGH | `ship-opening-a-pr` `ship-babysit` `ship-shipping` |
| 4 | Autopilot | HIGH | `run-autopilot-full` `run-autopilot-stack` |
| 5 | Build shape | HIGH | `build-refactoring` `build-prototype` `fix-perf` `fix-visual-parity` |
| 6 | Forensics | MEDIUM | `read-runtime-forensics` `read-trace-forensics` |
| 7 | Session | MEDIUM | `session-pause` `session-pickup` `session-worktree-cleanup` |
| 8 | Author | LOW | `author-skill` `author-eval` |

Prefer higher bands when the kind is unclear.

## Quick reference

**Kind.** `build-feature` new behavior from a named data shape · `fix-bug` defect with runtime evidence · `read-investigation` cited answer, no code · `plan-multi-phase` plan only

**Program.** `run-autonomous` one task to a predicate · `run-orchestrate` standing program, coordinator never codes · `run-hillclimb` one metric, keep or revert

**Ship.** `ship-opening-a-pr` end of every build or fix · `ship-babysit` green, not land · `ship-shipping` land the verified run

**Autopilot.** `run-autopilot-full` owners merge · `run-autopilot-stack` operator lands the chain

**Build shape.** `build-refactoring` behavior pinned · `build-prototype` throwaway to decide · `fix-perf` one-off measurement · `fix-visual-parity` image-diff zero

**Forensics.** `read-runtime-forensics` live process · `read-trace-forensics` dropped artifact

**Session.** `session-pause` clean stop · `session-pickup` inherit the trail · `session-worktree-cleanup` prune disk

**Author.** `author-skill` write or edit SKILL.md · `author-eval` blind candidate test

## How to use

1. Pick one rule id. Opening a PR is extra at the end of build or fix, not a second kind.
2. `Read` only `rules/<id>.md`.
3. Before running the steps, `Read` the library file named in that rule.
4. Do not bulk-read `rules/` or all of `AGENTS.md` unless stuck or asked.

```text
rules/fix-bug.md
rules/ship-babysit.md
```

Library path here: `ai/playbooks/<id>.md`. Dest: `.pi/playbooks/<id>.md`.

## Full reference

Skip rationale and misroute table: `AGENTS.md` (reference only; prefer `rules/` + this router).
