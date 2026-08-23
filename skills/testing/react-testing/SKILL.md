---
name: react-testing
description: React and React Native testing. Use when writing, reviewing, or fixing Vitest, Jest, Testing Library, RNTL, Playwright, or Maestro tests; choosing unit vs E2E; mocking hooks, routers, or native modules; or debugging flakes. Triggers on RTL queries, jest-expo, happy-dom, MSW, Expo Router, TanStack Query, fireEvent.press, getByRole.
metadata:
  version: "1.1.0"
---

# React + React Native testing

Progressive rules for component, hook, and UI tests. Discover the repo first. Read only rule files that match the task.

## Discover first

Before writing or changing tests:

1. Read `package.json` / workspace scripts and test deps (Vitest, Jest, RTL, RNTL, Playwright, Maestro, MSW).
2. Open a neighboring test and copy its runner, imports, folder, and mock style.
3. Read `AGENTS.md`, README, and any project test skill for commands and gates.
4. If there is no harness, propose the smallest one that matches this pack and confirm before adding deps.

Do not invent a second runner, a root `pnpm test`, or E2E the repo does not already use.

## Stack caveats

**Defaults when the project already has them:** React 18/19. Web units = Vitest or Jest + Testing Library. Native units = Jest (jest-expo if Expo) + RNTL. Web E2E = Playwright. Mobile E2E = Maestro.

**Prefer:** behavior through public UI; accessible queries; mock at the hook/service boundary; loading/empty/error; colocate units; deterministic fixtures; existing package scripts.

**Careful:** stubbing the whole UI kit; mixing MSW and client mocks in one domain; assuming a monorepo gate covers every package.

**Do not introduce:** Enzyme, Cypress, Detox, snapshots, Vitest for RN render, mega `AllTheProviders`, timeout/retry inflation — unless the repo already uses them.

Sibling **vitest** owns Vitest commands and config. **maestro**, **tdd**, and **playwright-cli** own their layers when present.

## When to apply

New or failing `*.test.ts(x)` / `*.spec.ts` / Maestro YAML; choosing a runner; mocking router or native modules; reviewing test quality or flakes.

## Priority bands

| Pri | Category | Impact | Prefix |
|-----|----------|--------|--------|
| 1 | Layer & runner | CRITICAL | `layer-` |
| 2 | Queries | CRITICAL | `query-` |
| 3 | Flakes | CRITICAL | `flake-` |
| 4 | Pitfalls | CRITICAL | `pitfall-` |
| 5 | Rendering | HIGH | `render-` |
| 6 | Mocking | HIGH | `mock-` |
| 7 | Async waits | HIGH | `async-` |
| 8 | Assertions | MEDIUM-HIGH | `assert-` |
| 9 | React Native | MEDIUM-HIGH | `rn-` |
| 10 | Web | MEDIUM | `web-` |
| 11 | E2E | MEDIUM | `e2e-` |

## Quick reference

**layer-:** `layer-choose-runner` Vitest / jest-expo / Playwright / Maestro · `layer-behavior-not-impl` public behavior · `layer-colocate-units` match existing layout · `layer-dont-retest-shared` no hook retest on native · `layer-loading-empty-error` three data states

**query-:** `query-roles-first` getByRole · `query-findby-async` findBy over waitFor+getBy · `query-testid-last` testID last · `query-native-text` RNTL text / toBeTruthy · `query-no-container` no querySelector

**flake-:** `flake-no-timeout-inflate` fix don't hide · `flake-quarantine-with-issue` issue + expiry · `flake-deterministic-fixtures` fixed IDs

**pitfall-:** `pitfall-enzyme` no Enzyme · `pitfall-cypress-detox` no extra E2E stack · `pitfall-silence-console` don't swallow act warnings · `pitfall-dont-invent-harness` don't invent infra

**render-:** `render-web-rtl` RTL · `render-native-rntl` RNTL · `render-no-mega-wrapper` thin wrappers · `render-user-event` userEvent vs press · `render-hooks-queryclient` renderHook + QueryClient

**mock-:** `mock-at-boundary` services not internals · `mock-hooks-in-ui` mock data hooks · `mock-msw-or-client` don't mix · `mock-router-web` stub the project router · `mock-expo-router` Expo Router markers · `mock-native-modules` storage / picker / keyboard · `mock-no-snapshots` never · `mock-no-overstub-kit` don't stub the UI kit

**async-:** `async-waitfor-expect` expect inside waitFor · `async-no-empty-act` no empty act · `async-no-sleep` no sleeps · `async-fake-timers-sparingly` clocks only

**assert-:** `assert-independent-oracle` no tautology · `assert-name-the-behavior` spec names · `assert-one-behavior` one behavior

**rn-:** `rn-jest-not-vitest` never Vitest for RN · `rn-transform-ignore` pnpm allow-list · `rn-nativewind-classname` token classNames · `rn-false-green` mocked mutate ≠ persist · `rn-feature-gate-gap` run what you edited

**web-:** `web-happy-dom` DOM env + jest-dom · `web-no-next` match the project's router · `web-no-root-test` use existing scripts

**e2e-:** `e2e-when-to-use` multi-route / device · `e2e-playwright-fixtures` project fixtures · `e2e-maestro-release` release builds · `e2e-page-objects` locators live on pages

## How to use

1. Discover the repo (scripts, neighboring tests, gates).
2. Pick **1–N** rule ids (higher priority first).
3. `Read` only `rules/<id>.md` (relative to this skill directory).
4. Do **not** bulk-read `rules/` or load all of `AGENTS.md` unless stuck or asked.
5. Reviewing/refactoring: walk categories top-down until covered.

## Full reference

Upstream pointers + compiled notes: `AGENTS.md` (reference only; prefer `rules/` + this router).
