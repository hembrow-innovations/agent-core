---
title: Stub native modules in jest setup
impact: HIGH
impactDescription: unmocked native modules crash Jest
tags: [mock, native]
---

## Stub native modules in jest setup

Every native Jest config needs a setup file that replaces modules with no Node implementation.

**Incorrect:** Inline `jest.mock("react-native-keyboard-controller")` in one test and surprise the next file.

**Correct:** `jest/setup.ts` (or app `jest/setup.ts`) stubs:
- `@react-native-async-storage/async-storage` → official mock
- `react-native-keyboard-controller` → ScrollView / View passthrough
- `@react-native-community/datetimepicker` → Pressables `mock-dtp-set` / `mock-dtp-dismiss` with a fixed date
- `react-native-toast-message` → `{ show, hide }`
- `.css` → style mock (NativeWind)

Notes: pnpm nests uncompiled RN under `.pnpm/`. `transformIgnorePatterns` must allow-list `react-native|expo|nativewind|@react-navigation`. See `rn-transform-ignore`.
