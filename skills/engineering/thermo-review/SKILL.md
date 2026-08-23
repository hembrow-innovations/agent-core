---
name: thermo-review
description: Run an extremely strict maintainability review for abstraction quality, giant files, and spaghetti-condition growth. Use for a thermo-nuclear code quality review, thermonuclear review, deep code quality audit, or especially harsh maintainability review.
disable-model-invocation: true
---

# Thermo-Nuclear Code Quality Review

Unusually strict review of implementation quality, maintainability, abstraction quality, and codebase health. Detail lives in `rules/`. **Read only relevant rules** for the diff under review.

## Posture (always)

Be **ambitious** about structure. Search for "code judo" moves: restructurings that preserve behavior while making the implementation dramatically simpler. Behavior-correct is not enough to approve.

Load first: `rules/tone-code-judo.md`, `rules/output-approval-bar.md`.

## When to apply

- Thermo-nuclear / thermonuclear / deep code quality audit
- Harsh maintainability review of a branch or PR
- Abstraction quality, giant files, spaghetti-condition growth

## Priority bands

- **1 CRITICAL.** Posture + approval: `tone-code-judo`, `output-approval-bar`, `std-file-size`, `std-no-spaghetti`
- **2 HIGH.** Standards + flags: remaining `std-*`, `smell-baseline`, `remedy-preferred`, `output-priority`
- **3 MEDIUM.** Fowler smells (`smell-*`), tone phrases, artifacts
- **4 LOW.** Rare smells (e.g. `smell-refused-bequest`)

Prefer higher bands when time is short. Do not bulk-read `rules/`.

## Project caveats

Discover limits in `AGENTS.md`. Examples, not the only paved path:

- File target ≤1000 LOC (hard 1250). 1k crossing is a common default smell
- Package ownership such as `packages/<group>/<domain>/<platform>/` for features/ui/core
- Repo-documented standards override Fowler baseline flags (`smell-baseline`)

## Quick reference

### Posture and approval (CRITICAL)

- `tone-code-judo`. Ambitious simplification; core prompt; delete complexity
- `output-approval-bar`. Approval criteria and presumptive blockers
- `std-file-size`. Do not cross 1k lines without strong reason
- `std-no-spaghetti`. No ad-hoc branches in unrelated flows

### Standards (HIGH)

- `std-clean-design`. Cleaner structure over "it works"
- `std-direct-boring`. Direct code over magic and thin wrappers
- `std-types-boundaries`. Casts, any, unknown, silent fallbacks
- `std-canonical-layer`. Right package; reuse canonical helpers
- `std-orchestration`. Parallelize independent work; atomic updates
- `std-review-questions`. Checklist for every meaningful change
- `std-flag-aggressively`. Patterns to escalate

### Smells (Fowler)

- `smell-baseline`. Repo overrides; judgement call only
- `smell-mysterious-name`. Name doesn't reveal role
- `smell-duplicated-code`. Same logic shape twice
- `smell-feature-envy`. Method uses another's data more
- `smell-data-clumps`. Fields that travel together
- `smell-primitive-obsession`. Primitive standing in for domain type
- `smell-repeated-switches`. Same cascade in multiple places
- `smell-shotgun-surgery`. One change scatters across files
- `smell-divergent-change`. One module edited for many reasons
- `smell-speculative-generality`. Abstraction without a real need
- `smell-message-chains`. Long a.b().c().d() walks
- `smell-middle-man`. Mostly delegates onward
- `smell-refused-bequest`. Ignores most of inheritance

### Remedies, tone, output

- `remedy-preferred`. Structural fixes to suggest
- `tone-delivery`. Direct tone and sample phrases
- `output-priority`. Finding order; high-conviction over nits
- `output-artifacts`. HTML + MD via **management**

## How to use

```
rules/tone-code-judo.md
rules/output-approval-bar.md
rules/std-no-spaghetti.md
```

1. Read this router; pick 1-N rule ids for the diff.
2. `Read` only those `rules/<id>.md` files.
3. Do not bulk-read `rules/`.
4. Prefer CRITICAL/HIGH bands first.
5. Write findings per `output-priority` and `output-artifacts`; gate approve on `output-approval-bar`.
