# Playbooks catalog (reference only)

Prefer `rules/` plus the `SKILL.md` router. This file is the skip rationale. It is not auto-injected on skill load.

Twenty-four rules. One per file in `ai/playbooks/` except `README.md`. Each rule is the matcher and the contract. The ordered steps stay in the library file. Install copies those files into dest `.pi/playbooks/`.

This pack exists so a human can judge progressive disclosure over playbooks. It is not the source of truth for the steps.

## How to review

Read the incorrect line. If you cannot picture an agent picking the wrong playbook without it, delete the rule.

## Misroutes

- Feature vs figure-it-out. A migration across many call sites is figure-it-out even when the ask sounds like a feature.
- Feature vs Prototype. No decision to make means Feature. A throwaway to decide is Prototype.
- Feature vs Refactoring. New behavior is Feature. Structure only is Refactoring.
- Bug fix vs Investigation. A cited answer with no code is Investigation. A defect to fix is Bug fix.
- Bug fix vs Perf vs Hillclimb. One defect is Bug fix. One measured slowness is Perf. A loop against a target is Hillclimb.
- Runtime vs Trace forensics. Live process vs a file already captured. Neither ships a fix.
- Autonomous run vs Orchestrate. One predicate inside the session vs a standing program. Ceremony on a half-hour job is the measured failure.
- SaaS company vs Orchestrate. Living tmux panes the human can type into vs nicobailon children. Lead without `--project` is a failed team, not Orchestrate.
- Autonomous run vs figure-it-out. A known playbook driven to done vs a bespoke workflow you design first.
- Babysit vs Shipping vs Opening a PR. Open, then green, then land. Green is not safe.
- Autopilot-full vs Autopilot-stack. Owners merge vs the operator lands one chain.
- Pause vs Autonomous run. Explicit stop vs "keep going".

## Do not put here

The full step lists. Graphite command recipes. `scripts/orch` and `scripts/watch-pr` internals.
