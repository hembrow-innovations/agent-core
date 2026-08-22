---
title: Allow-list RN packages for pnpm Jest
impact: HIGH
impactDescription: untransformed ESM in .pnpm crashes Jest
tags: [rn, jest, pnpm]
---

## Allow-list RN packages for pnpm Jest

pnpm nests uncompiled React Native under `.pnpm/`. Jest must transform those packages. Copy an existing native `transformIgnorePatterns` — do not invent a shorter one.

**Incorrect:**
```js
transformIgnorePatterns: ["/node_modules/"],
```

**Correct:** Allow-list at least `react-native|expo|nativewind|@react-navigation|@expo|@rn-primitives`. Match a neighboring `packages/features/*/native/jest.config.js`.

Notes: Keyboard-controller often needs `moduleNameMapper` instead of an inline factory because NativeWind breaks those factories. Follow the app's `jest.config.js`.
