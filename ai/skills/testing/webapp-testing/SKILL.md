---
name: webapp-testing
description: Router for web and mobile test choice. Use when writing tests, debugging a failure, or picking unit vs browser vs E2E. Chooses vitest, playwright-cli, the project's web E2E script, or maestro.
---

# Webapp testing (router)

Do not re-implement patterns here. Discover the repo, pick a path, then load the specialist.

If `AGENTS.md` or `WORKSPACE.md` already names a tracker (`.scratch/`, `docs/planning/`, GitHub Issues), that file wins.

## Discover first

1. Read root and package `package.json` for `test`, `e2e`, and filter scripts. Also read `justfile` and CI.
2. Open a neighboring test and copy its runner, folder, and mock style.
3. Read `AGENTS.md`, README, and any project test skill for gates and scratch dirs.
4. Search `docs/` for committed test policy. Load **docs** before you write a durable note.

Do not invent a workspace-wide `pnpm test` or a second E2E stack. `pnpm e2e:web` and `pnpm --filter @project_name/... test` are examples, not the only paved path.

## Decision tree

```
What are you testing?
  |- Pure UI / CVA / feature component  →  vitest
  |- TanStack Query hook / API service  →  vitest
  |- Schema / query keys / fixtures     →  vitest
  |- Interactive browser debug          →  playwright-cli
  |- Screenshot / fill form / explore   →  playwright-cli
  |- Full web E2E / release bar         →  project's Playwright suite
  |- Mobile Maestro / device / emulator →  maestro
  |- Mobile unit (jest-expo / RNTL)     →  project's native unit script
```

Then load the specialist. Do not stay in this file.

The committed web E2E suite is `npx playwright test` or the project's `e2e` script, not **playwright-cli**.

## Commands

Use the script the repo already exposes. Typical shapes:

```bash
pnpm test                         # only if the package defines it
pnpm --filter <pkg> test          # monorepos
npx vitest run
npx playwright test               # committed web E2E
maestro test path/to/flow.yaml
```

Start the web app with the project's dev script. Read the printed origin before browser work. Do not invent host or port.

## Specialists

- **vitest**. Unit, component, hooks, API, fixtures.
- **playwright-cli**. Agent-driven browser. open, goto, click, snapshot, screenshot.
- **maestro**. Device and emulator E2E. YAML flows.
- **tdd**. What a good test is. Red-green. Vertical slices.

Load one. Do not restate it here.

## Shared rules

- Test behavior, not implementation.
- Prefer accessible queries (`getByRole`, `getByLabelText`).
- Mock at the service boundary, not deep in the tree.
- Cover loading, error, and empty for data-fetching UI.
- E2E for multi-route flows. Unit for pure logic and CVA variants.
- Agent screenshots and dumps go in a gitignored scratch dir the project already uses.

## Policy

Durable test policy lives in `docs/`. Load **docs**. Discover gates, flake policy, and coverage maps under `docs/`. Do not treat a life-engine path such as `docs/reference/guides/e2e-flake-policy.md` as the only law.

Flake follow-ups are **management** issues. File a **management** issue. Quarantine only with that id and an expiry. Do not put flake work in `docs/`.

A layout note such as `tests/README.md` wins when it exists. Otherwise keep units colocated and put Playwright and Maestro where the repo already does.
