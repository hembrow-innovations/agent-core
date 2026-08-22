---
title: Do not invent a harness the repo lacks
impact: HIGH
impactDescription: extra runners and E2E stacks do not belong in a thin app
tags: [pitfall]
---

## Do not invent a harness the repo lacks

If the project has no test script, do not drop in Jest-expo, Maestro, Playwright, or a monorepo dispatcher. Propose the smallest harness that matches the surface, then wait.

**Incorrect:** Adding jest-expo and Maestro to a six-route marketing site that has no tests.

**Correct:** Web-only app with no tests → propose Vitest + Testing Library + a DOM env, colocated `*.test.tsx`, role queries. Native app with no tests → propose Jest (jest-expo if Expo) + RNTL. Stop unless the user asks for E2E.

Notes: Copy nothing from another product monorepo unless this repo already has that layout.
