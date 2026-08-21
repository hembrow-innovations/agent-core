---
name: playwright-cli
description: Drive web and desktop UI tests with Playwright (CLI and test runner). Use when writing, running, or debugging Playwright e2e tests.
---

# Playwright CLI / e2e

Thin playbook for Playwright. Discover project layout at runtime; do not invent paths.

## Prerequisites

```bash
# Prefer the project's local binary
npx playwright --version 2>/dev/null || npx playwright-core --version 2>/dev/null
ls node_modules/@playwright/test 2>/dev/null
```

If Playwright isn't installed, check `package.json` and propose adding `@playwright/test` (or the stack the repo already uses). Install browsers only when needed:

```bash
npx playwright install
```

## Discover project conventions

Before writing or changing tests:

1. Find config: `playwright.config.*`, `playwright.config.*.*`
2. Find tests: paths from config `testDir`, or common dirs `e2e/`, `tests/e2e/`, `**/*.spec.ts`
3. Read npm/pnpm/yarn scripts and CI for the canonical run command
4. Match existing fixtures, Page Object (or not) patterns, and assertion style

If none exist, propose a minimal `playwright.config.ts` + test dir and confirm with the user.

## Canonical commands

```bash
# Run all e2e (prefer package scripts when present)
npx playwright test

# One file / project / headed / debug
npx playwright test path/to/file.spec.ts
npx playwright test --project=chromium
npx playwright test --headed
npx playwright test --debug
npx playwright show-report
```

For ad-hoc exploration (not committed tests), `npx playwright codegen <url>` is fine.

## Authoring rules

- Test user-visible behavior at a stable seam (page/URL/component under test), not private internals.
- Prefer role/label/text and `getByTestId` over brittle CSS/xpath.
- Use web-first assertions (`expect(locator).toBeVisible()`, etc.) for auto-waiting.
- Isolate state: each test sets up what it needs; don't rely on run order.
- Keep secrets out of the repo; use env vars the project already uses.

## Desktop / Electron

If the project is Electron or another Playwright-driven desktop shell, follow **that repo's** launch config (`_electron`, custom `transport`, etc.). Don't assume a browser base URL.

## Debug loop

1. Reproduce with the project script or `npx playwright test <path>`.
2. Use trace/report on failure: `npx playwright show-report` / `--trace on`.
3. Minimize to one failing test; fix app or test; re-run.
4. Quarantine flakes only with user approval; prefer fixing sync/selectors.

## Out of scope

Full Playwright docs dump, visual-regression platform setup, and non-Playwright tools unless asked.
