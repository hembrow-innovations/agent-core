---
title: Do not invent a second runner
impact: CRITICAL
impactDescription: two harnesses, half the suite unrun
tags: [discover, harness]
---

## Do not invent a second runner

A second runner is not a skill. If the repo is on Jest, stay on Jest. If it is on Vitest, stay on Vitest.

**Incorrect:** Adding `vitest` and `vitest.config.ts` to a package whose scripts already call Jest.

**Correct:** Use the runner the package already has. If there is no harness, propose Vitest 4 and wait before adding deps.

Notes: React Native render stays on Jest. See `env-not-for-rn` and `react-testing`.
