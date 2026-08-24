---
title: Never Vitest for React Native render
impact: CRITICAL
impactDescription: happy-dom cannot host RN
tags: [rn, jest, vitest]
---

## Never Vitest for React Native render

Native packages use Jest + RNTL (jest-expo if Expo). Vitest + a DOM env is web/data only. Do not "unify the runner."

**Incorrect:** Adding `vitest.config.ts` to a native package so you can reuse web helpers.

**Correct:** Copy a neighboring native `jest.config.js` (`preset: "jest-expo"` on Expo). Setup file from `mock-native-modules`. Run the package's existing `test` script.

Notes: Shared logic stays in the shared package and uses the web/data runner. Native only tests presentation. See `layer-dont-retest-shared`.
