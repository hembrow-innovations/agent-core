---
title: E2E only for multi-route or device
impact: HIGH
impactDescription: E2E used as a unit test is slow and opaque
tags: [e2e, layer]
---

## E2E only for multi-route or device

Playwright and Maestro prove journeys: sign-in → home, CRUD across pages, deep links. They do not prove style variants or hook options.

**Incorrect:** A Playwright spec whose only step is "button has class `bg-primary`".

**Correct:** Unit for variants and loading/empty. Playwright for a real auth cookie + landing route. Maestro for a deep link + sign out.

Notes: If a unit test cannot see the bug, move up one layer — not straight to device. Skip E2E entirely if the repo has no suite and the user did not ask for one.
