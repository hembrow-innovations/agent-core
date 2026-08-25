---
title: React app
impact: HIGH
impactDescription: Inventing a framework or kit the repo does not use
tags: [build]
---

## React app

Building or changing components, routes, data hooks, UI, or tests in a React web or native app.

**Incorrect:** Invent Next APIs, SWR, or a second UI kit. Skip the neighboring file. Ship unit green without driving the running app. Treat a `.tsx` bug as this playbook.

**Correct:** You own the stack match. Discover, copy the neighbor, name the data shape, red on public UI, delegate, verify in the running app, Opening a PR.

1. Discover framework, UI kit, data layer, test runner, and three files to copy.
2. Pick **tanstack-ui** or **frontend-design** plus **vercel-react-best-practices** from that discovery. **typescript-best-practices** on every `.tsx`.
3. Name the data shape. `how`. `architect` if it crosses a function boundary.
4. Throughput checkpoint.
5. Red tests on public UI. **tdd** plus **react-testing**.
6. Delegate the diff. Review it.
7. Drive the running app. Screenshot the new states.
8. Opening a PR.

Library: `ai/playbooks/react-app.md` (dest: `playbooks/react-app.md`).

Notes: No React tree is `build-feature`. A throwaway sketch is `build-prototype`. A reported defect is `fix-bug`. Pixel-exact match is `fix-visual-parity`. Measured slowness is `fix-perf`.
