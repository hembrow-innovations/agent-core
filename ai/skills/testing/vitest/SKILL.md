---
name: vitest
description: Vitest 4 unit and integration tests. Use when writing, running, reviewing, or debugging *.test.ts(x) / *.spec.ts, vitest.config, vi.mock, vi.spyOn, coverage, typecheck, or migrating from Jest. Triggers on vitest run, defineConfig from vitest/config, happy-dom, expect.poll, vi.hoisted, test.projects.
metadata:
  version: "1.0.0"
---

# Vitest

Progressive rules for Vitest 4 on Vite and Node. Discover the repo first. Read only rule files that match the task.

## Discover first

1. Read `package.json` / workspace scripts and test deps (Vitest, Jest, Testing Library, happy-dom, jsdom).
2. Open a neighboring test and copy its runner, imports, folder, and mock style.
3. Read `AGENTS.md`, README, and any project test skill for commands and gates.
4. If there is no harness, propose the smallest Vitest config that matches this pack and confirm before adding deps.

Do not invent a second runner or a root `pnpm test` the repo does not already use.

## Stack caveats

**Assumes:** Vitest 4 (Vite >= 6, Node >= 20). Default environment is `node`. Default pool is `forks`.

**Prefer:** project scripts; `import { expect, test, vi } from "vitest"`; `defineConfig` from `vitest/config`; `vi.mock(import("./mod.js"), factory)`; `vitest run` in CI; `test.projects` for mixed envs.

**Careful:** `globals` is off by default. `workspace` is now `projects`. `coverage.all` is gone. `restoreAllMocks` only restores `vi.spyOn`. Intra-file calls cannot be mocked.

**Do not introduce:** Jest if Vitest is already the runner. Vitest for React Native render (`react-testing`). Cypress. Enzyme. Browser Mode for pure function tests. A second config stack.

Sibling skills: `tdd` owns what a good test is. `react-testing` owns RTL, queries, and RN. `playwright-cli` is not `vitest`.

## When to apply

New or failing `*.test.ts(x)` / `*.spec.ts`. `vitest.config`. `vi.mock` failures. Coverage or typecheck. Jest migration. Pool, alias, or environment errors.

## Priority bands

| Pri | Category | Impact | Prefix |
|-----|----------|--------|--------|
| 1 | Discover | CRITICAL | `disc-` |
| 2 | Config | CRITICAL | `config-` |
| 3 | Run | CRITICAL | `run-` |
| 4 | Pitfalls | CRITICAL | `pitfall-` |
| 5 | Environment | HIGH | `env-` |
| 6 | Mocking | HIGH | `mock-` |
| 7 | Isolation | HIGH | `isolate-` |
| 8 | Async | HIGH | `async-` |
| 9 | Setup | MEDIUM-HIGH | `setup-` |
| 10 | Assertions | MEDIUM | `assert-` |
| 11 | Coverage | MEDIUM | `cov-` |
| 12 | Types | MEDIUM | `type-` |
| 13 | Migration | MEDIUM | `migrate-` |
| 14 | Browser | LOW | `browser-` |
| 15 | Perf | LOW | `perf-` |

## Quick reference

**disc-:** `disc-read-scripts` scripts and deps · `disc-match-conventions` copy a neighbor · `disc-dont-invent-runner` no second runner

**config-:** `config-defineconfig` vitest/config · `config-dedicated-file` vitest.config when needed · `config-projects-not-workspace` projects · `config-dir-over-exclude` test.dir · `config-no-match-globs` no MatchGlobs

**run-:** `run-project-scripts` existing script · `run-once-in-ci` vitest run · `run-filter-not-only` filter not only · `run-bun-run-test` bun run test · `run-related-changed` related and changed

**pitfall-:** `pitfall-tsconfig-paths` vite-tsconfig-paths · `pitfall-relative-alias` absolute alias · `pitfall-conditions` ssr.resolve.conditions · `pitfall-options-second-arg` options second · `pitfall-same-file-mock` no intra-file mock · `pitfall-timeout-inflate` fix flakes · `pitfall-unhandled-rejection` await it

**env-:** `env-node-default` node for pure · `env-happy-dom` DOM units · `env-file-comment` @vitest-environment · `env-not-for-rn` never RN render

**mock-:** `mock-vi-api` vi.fn spyOn · `mock-factory-exports` named exports · `mock-import-path` import() path · `mock-hoisted` vi.hoisted · `mock-import-actual` importOriginal · `mock-no-automock-dir` __mocks__ needs vi.mock · `mock-restore-vs-reset` v4 restore · `mock-stub-env` stubEnv · `mock-constructor` class not arrow · `mock-deps-inline` server.deps.inline · `mock-at-boundary` services

**isolate-:** `isolate-forks-default` pool forks · `isolate-native-addons` native needs forks · `isolate-max-workers` maxWorkers · `isolate-no-shared-files` no shared files

**async-:** `async-await` no done · `async-expect-rejects` rejects · `async-no-sleep` expect.poll · `async-fake-timers` fake timers

**setup-:** `setup-import-apis` import from vitest · `setup-files-vs-global` setupFiles · `setup-hooks-return` return is teardown · `setup-test-extend` fixtures

**assert-:** `assert-tobe-vs-equal` toBe vs toEqual · `assert-independent-oracle` no tautology · `assert-one-behavior` one behavior · `assert-no-ui-snapshots` no UI snaps · `assert-soft-poll` soft and poll

**cov-:** `cov-include-pattern` coverage.include · `cov-no-all-flag` all removed

**type-:** `type-expect-typeof` expectTypeOf · `type-own-project` typecheck project

**migrate-:** `migrate-jest-globals` import or globals · `migrate-jest-mock` factory shape · `migrate-v4-coverage` include · `migrate-v4-pools` top-level pool opts

**browser-:** `browser-when` real layout only · `browser-provider-object` playwright() · `browser-import-vitest` vitest/browser

**perf-:** `perf-isolate-false-units` isolate false · `perf-file-parallelism` sequential project

## How to use

1. Discover the repo (scripts, neighboring tests, gates).
2. Pick 1 to N rule ids (higher priority first).
3. `Read` only `rules/<id>.md` (relative to this skill directory).
4. Do **not** bulk-read `rules/` or load all of `AGENTS.md` unless stuck or asked.
5. Reviewing or refactoring: walk categories top-down until covered.

## Full reference

Upstream Vitest 4 docs and compiled notes: `AGENTS.md` (reference only; prefer `rules/` + this router).
