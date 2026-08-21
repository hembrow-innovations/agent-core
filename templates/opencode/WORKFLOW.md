# Completing work with pstack on OpenCode

How an operator uses this repo + installed pstack. Customize paths and verify steps for your stack.

```bash
cd <repo-root> && opencode   # prefer agent poteto / /poteto-mode
```

## Daily loop

```text
/poteto-mode claim next ready unit from planning issues matching roadmap phase.
read docs section named in the issue. architect seams if crossing modules.
tdd pure logic first, then glue. run project verify skill. /interrogate. /unslop PR body.
```

Primary agent **`poteto`** is sticky poteto-mode. It picks the playbook; you keep talking in plain English.

## Playbook → work

| Situation | Playbook | Notes |
|-----------|----------|--------|
| “How does X work in docs+code?” | investigation + `/how` | Read-only; good before coding |
| “Why is Y designed this way?” | investigation + `/why` | Pulls git/docs/issues evidence |
| Implement a named feature | **feature** | Name the data shape first |
| Behavior-preserving module split | **refactoring** | Keep tests green |
| Defect with repro | **bug-fix** | Repro → root cause → fix → proof |
| Measured slowness | **perf-issue** / runtime-forensics | Baseline first |
| Throwaway design fork | **prototype** + `/arena` | 2–3 arms, pick best |
| Multi-week program | **multi-phase-plan** then **orchestrate** | Stacked PRs from roadmap |
| Overnight drain of ready issues | **autonomous-run** / **autopilot-stack** | One owner per PR; root verifies |
| PR stuck on review/CI | **babysit** | Adapt if no CI |
| Land verified stack | **shipping** | Human still owns merge policy |
| Resume after sleep | **session-pickup** / **pause-safely** | |
| No playbook fits | `/figure-it-out` | Designs an auditable playbook |

## Orchestrate sketch

Coordinator chat (orchestrate playbook):

1. **Inventory** — roadmap phases + open issues; group into stacks.
2. **Doc gates** — docs-only units land first; no code until design exists when docs lead.
3. **Core spine** — pure logic / domain with tdd. Each unit ends green.
4. **Integration** — UI/runtime glue; project verify skill.
5. **Interrogate wave** — multi-model review on each stack head before merge-ready.
6. **Human land** — shipping playbook presents contiguous green run; human merges.

Example prompt:

```text
/poteto-mode orchestrate from docs/planning (or your issue tracker).
constraints in AGENTS.md. docs lead code when present.
one unit per PR. leave residuals as new issues. show decision log
via /show-me-your-work under .pstack/decisions.tsv.
```

## Verification bar

Before any unit is “done”:

1. Project build / typecheck / lint when applicable
2. Automated tests for changed behavior
3. Project `verify-*` skill (or harness) drives the real path
4. Optional `/interrogate` on the diff

Proxy checks (“it compiles”, “LGTM”) do not count — principle **prove-it-works**.

## First-time setup

1. Install pstack profile from agent-core (see repo README).
2. Fill `AGENTS.md` with engine, layout, and hard stops for *this* project.
3. Run `/setup-pstack` to set model roles (or keep inherit-parent).
4. Optionally `/create-verification-skill` for a project-local prove path.
5. Start with `/poteto-mode` or the `poteto` agent.

## What pstack will not replace by itself

- Engine-specific MCP / editor tooling
- Human product taste and merge authority
- Project-local balance, art, or policy decisions
