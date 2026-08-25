---
title: React app
when: "Building or changing a React web or native app: components, routes, data hooks, UI, or tests."
---

### React app

**You own the stack match. Copy the neighboring file. Do not invent a framework.** For "add this screen", "build this component", "wire this hook", "this React page", or any new behavior that lives in a React tree. Distinct from Feature, which is the same loop with no React tree, Prototype, which is throwaway, Visual parity, which is image-diff, and Bug fix, which starts from a repro.

The repo already picked Next, Vite, TanStack Start, or Expo. It already picked a UI kit, a data layer, and a test runner. Inventing Next APIs in a Vite app, a second kit next to the one in `package.json`, or a hardcoded palette is the failure mode this playbook exists to stop.

1. Discover the stack before any design. Done when you can name the framework, UI kit, data layer, test runner, and the three files you will copy.
   - Read root and package `package.json` for the app framework, UI packages, data library, and test scripts.
   - Open one neighboring route, one neighboring component, and one neighboring test. Copy their imports, folder shape, and runner.
   - Pick the UI skill from what you found. TanStack Start uses **tanstack-ui**. Other React web uses **frontend-design** plus **vercel-react-best-practices**. Expo or React Native uses **frontend-design** plus **react-testing**. Do not load Next APIs, SWR, or a second kit the repo does not have.
   - Load **typescript-best-practices** for every `.ts` / `.tsx` file. Load **typography** only when faces or swap are in scope.
2. Name the data shape before anyone writes JSX. Component state, query keys, route params, and visual variants are the shape. A screen with `isLoading` / `isError` / `data` booleans is the missing shape. Discriminated unions, CVA variants, and Query key factories beat scattered flags. Run **how** over the affected route or package. If the shape crosses a function boundary, **architect**. A skip stays as `architect skipped: <reason>`.
3. Write the throughput checkpoint as four todo items. A dimension that does not apply keeps its item with `n/a: <reason>` rather than being dropped:
   - **Blocking first steps.** Shared primitives, tokens, and query keys before screens that consume them.
   - **Independent workstreams.** Disjoint files, routes, or packages parallelize. Shared writes serialize.
   - **Shared mutable state.** Default to splitting the target. Serialize only for real invariants.
   - **Smallest safe decomposition.** If one worker is best, name why.
4. Red tests on the public UI before the implementation. Load **tdd** and **react-testing**. Confirm seams against the neighboring test. For data-fetching UI the first reds are loading, empty, error, and the happy path. Accessible queries. Mock at the hook or service boundary. Do not stub the UI kit. **webapp-testing** picks the runner. Skip this step only when the change is pure visual tokens with no behavior, and write `skip: tokens only`.
5. Delegate code-writing to a subagent using your configured feature model (default `grok-4.6-fast-xhigh`) with a specific scope: file paths, the named data shape, the neighboring files to copy, and success criteria. Review the diff yourself. Mandatory. No skip-with-reason escape. You can spawn a subagent even though you are one. "The app is small" is wrong. Comments per **Comments**. Surgical edits. Re-ground against the source for upstream-derived files.
6. Verify on the matching surface. Unit green is not the screen. Drive the running app. **playwright-cli** for web and React Native Web. Maestro for a device or emulator. Screenshot the new states. "Inconclusive" or wrong-surface is not a pass. Flag it.
7. Rebase into small, ordered commits. Build, verify, and commit each unit before the next.
8. Run **Opening a PR**.

A reported defect in a `.tsx` file is still **Bug fix**. A throwaway to decide layout is still **Prototype**. Pixel-exact match is still **Visual parity**. Measured slowness is still **Perf issue**. A migration across many call sites is `/figure-it-out`.

**Reply:** stack you matched, neighboring files you copied, the data shape, what you built, verify commands and screenshot paths, open decisions.
