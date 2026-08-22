# Completing work with draconic on Pi

How an operator uses this install. Customize paths and verify steps for your stack.

```bash
cd <repo-root> && pi
```

Trust the project when Pi asks. Then `/draconic-mode` or just talk. Sticky boot is in `.pi/APPEND_SYSTEM.md`.

## Daily loop

```text
/draconic-mode claim next ready unit from planning issues matching roadmap phase.
read docs section named in the issue. architect seams if crossing modules.
tdd pure logic first, then glue. run project verify skill. /interrogate. /unslop PR body.
```

Primary mode is draconic. It picks the playbook. You keep talking in plain English.

## Playbook to work

| Situation | Playbook | Notes |
|---|---|---|
| How does X work in docs and code | investigation + `/how` | Read-only. Good before coding |
| Why is Y designed this way | investigation + `/why` | git and gh evidence. No MCP |
| Implement a named feature | feature | Name the data shape first |
| Behavior-preserving module split | refactoring | Keep tests green |
| Defect with repro | bug-fix | Repro, root cause, fix, proof |
| Measured slowness | perf-issue / runtime-forensics | Baseline first |
| Throwaway design fork | prototype + `/arena` | 2-3 arms, pick best |
| Multi-week program | multi-phase-plan then orchestrate | One unit per session unless spawn is enough |
| PR stuck on review or CI | babysit | Poll with `gh` |
| Land a verified change | shipping | Human still owns merge policy |
| Resume after sleep | session-pickup / pause-safely | Use `/resume` or `/tree` |
| No playbook fits | `/figure-it-out` | Designs an auditable playbook |

## Verification bar

Before any unit is done:

1. Project build, typecheck, lint when applicable
2. Automated tests for changed behavior
3. Project `verify-*` skill or harness drives the real path
4. Optional `/interrogate` on the diff

Proxy checks do not count. Principle prove-it-works.

## First-time setup

1. Install this pack into the project.
2. Fill `AGENTS.md` with engine, layout, and hard stops for this project.
3. Run `pi`, trust the folder, then `/setup-draconic`.
4. Optionally `/create-verification-skill`.
5. Start with `/draconic-mode`.

## What this pack will not replace

- Engine-specific MCP or editor tooling
- Human product taste and merge authority
- Cloud fleets, Graphite drains, and Cursor `/loop`
- Project-local balance, art, or policy decisions
