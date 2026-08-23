# React + React Native testing — reference only

**Prefer `rules/` + `SKILL.md` stack notes.** This file is optional bulk context for humans or when the agent is stuck. Do not load it by default on skill activation.

## Official docs

- Testing Library principles: https://testing-library.com/docs/guiding-principles
- Which query: https://testing-library.com/docs/queries/about
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro
- React Native Testing Library: https://callstack.github.io/react-native-testing-library/
- user-event: https://testing-library.com/docs/user-event/intro
- Vitest: https://vitest.dev/guide/
- jest-expo: https://docs.expo.dev/develop/unit-testing/
- Playwright: https://playwright.dev/docs/writing-tests
- Maestro: https://docs.maestro.dev
- Kent C. Dodds, "Testing Implementation Details": https://kentcdodds.com/blog/testing-implementation-details
- Common Testing Library mistakes: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

## Discover the repo

Do not assume Next.js, Expo, Vitest, or a monorepo gate. Read:

1. Root and package `package.json` — `test` / `e2e` scripts and deps.
2. Existing `*.test.ts(x)`, `*.spec.ts`, Maestro YAML — runner, imports, folders.
3. `AGENTS.md`, README, `justfile`, CI, leftover project skills (`vitest`, `maestro`).
4. Router and data libs actually imported (`react-router`, `@tanstack/react-router`, `next/navigation`, `expo-router`, TanStack Query, etc.).

Match what you find. If nothing exists, propose Vitest + RTL for web or jest-expo + RNTL for Expo, and wait for confirmation before adding deps.

## Decision tree

```
What failed or what are you adding?
  schema / keys / API / hooks     → unit runner already used for data
  web primitive / feature page    → Vitest or Jest + RTL
  native primitive / screen       → Jest (jest-expo if Expo) + RNTL
  multi-route web / desktop       → Playwright if the repo has it
  device / deep link              → Maestro if the repo has it
  authz / multi-user              → the repo's integration or DB suite
```

Never Vitest for RN render. Never retest a shared hook package inside a native leaf.

## Commands

Use the scripts the repo already exposes. Typical shapes:

```bash
pnpm test                         # only if the package defines it
pnpm --filter <pkg> test          # monorepos
npx vitest run
npx jest
npx playwright test
maestro test path/to/flow.yaml
```

Do not invent a workspace-wide entrypoint. Prefer package filters and existing `just` / npm scripts.

## Query priority

1. `getByRole` / `getByLabelText`
2. `getByPlaceholderText` / `getByText`
3. `getByTestId` (skeletons, icon-only, colliding copy)
4. never `container.querySelector`

Web matchers: jest-dom (`toBeInTheDocument`). Native: `toBeTruthy` / `toBeNull`. Async appear: `findBy`. Absence: `queryBy`.

## Mock altitude

| Test | Mock |
|---|---|
| Feature web / native UI | data hooks + router + toast |
| Data layer, mock-client style | the client / query helper the hook already uses |
| Data layer, MSW style | `setupServer`; do not mix with mock-client in that domain |
| Native Jest setup | AsyncStorage, router, keyboard, date picker, CSS |
| Playwright | real app; project fixtures for auth |
| Maestro | real release build; project seed user |

## Flake policy

Fix the wait or the product. Do not inflate timeouts or retries. Quarantine only with an issue id and an expiry if the repo has that path. No bare `test.skip`. No `waitForTimeout`. No empty `act`.

Maestro scars that show up in many apps: debug `inputText` DEADLINE, `hideKeyboard` sending back, colliding visible text, time-of-day greetings.

## Sibling skills

- `tdd` owns what a good test is, seams, and tautologies
- `vitest` owns commands, config, `vi.mock`, and coverage
- `maestro` — device E2E
- `playwright-cli` — interactive browser, not the suite
