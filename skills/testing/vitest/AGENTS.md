# Vitest 4. Reference only

**Prefer `rules/` + `SKILL.md` stack notes.** This file is optional bulk context for humans or when the agent is stuck. Do not load it by default on skill activation.

## Official docs

- Getting started: https://vitest.dev/guide/
- CLI: https://vitest.dev/guide/cli
- Config: https://vitest.dev/config/
- Common errors: https://vitest.dev/guide/common-errors
- Mocking modules: https://vitest.dev/guide/mocking/modules
- Mock functions: https://vitest.dev/guide/learn/mock-functions
- Environment: https://vitest.dev/guide/environment
- Projects: https://vitest.dev/guide/projects
- Coverage: https://vitest.dev/guide/coverage
- Type testing: https://vitest.dev/guide/testing-types
- Browser Mode: https://vitest.dev/guide/browser/
- Migration (Vitest 4, Jest, Mocha): https://vitest.dev/guide/migration
- LLM-oriented guide dump: https://vitest.dev/guide.md

Requires Vite >= 6 and Node >= 20. Current line is Vitest 4.

## Discover the repo

Do not assume Vite, a monorepo gate, or `globals: true`.

1. Root and package `package.json`. Read `test` scripts and deps.
2. Existing `*.test.ts(x)` / `*.spec.ts`. Copy runner, imports, folders.
3. `vitest.config.*` or `test` inside `vite.config.*`.
4. `AGENTS.md`, README, justfile, CI, leftover project skills.

Match what you find. If nothing exists, propose Vitest 4 and wait before adding deps.

## Decision tree

```
What failed or what are you adding?
  no runner yet                         → propose Vitest, wait
  Jest already here                     → stay on Jest (disc-dont-invent-runner)
  RN screen / RNTL                      → Jest, not Vitest (env-not-for-rn)
  cannot find module / alias            → pitfall-tsconfig-paths, pitfall-relative-alias
  vi.mock factory / TDZ                 → mock-factory-exports, mock-hoisted
  jest.mock / requireActual             → migrate-jest-mock
  workspace / MatchGlobs                → config-projects-not-workspace
  coverage missing files                → cov-include-pattern
  segfault / worker terminate           → isolate-forks-default
  custom package exports                → pitfall-conditions
  real layout / ARIA                    → browser-when
  pure function                         → env-node-default
```

## Canonical commands

Use the project's script when it exists.

```bash
vitest run
vitest run src/sum.test.ts
vitest run src/sum.test.ts:12
vitest run -t "adds 1"
vitest run --project unit
vitest related --run src/sum.ts
vitest run --changed
vitest --typecheck.only
```

Bare `vitest` watches on a TTY. Agents use `run`. `bun test` is not Vitest.

## Maintain this pack

```bash
node skills/testing/vitest/scripts/validate.mjs
```

The script fails if `SKILL.md` grows past 150 lines, if the index cites a missing rule, or if a rule file is not in the index.

## Sibling skills

- `tdd` owns what a good test is, seams, and tautologies
- `react-testing` owns RTL, queries, RN, and the Playwright suite vs unit split
- `playwright-cli` is the interactive browser, not `vitest`
- `maestro` owns device E2E
