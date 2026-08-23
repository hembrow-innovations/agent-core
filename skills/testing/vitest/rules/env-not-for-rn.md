---
title: Never use Vitest to render React Native
impact: CRITICAL
impactDescription: false greens or unrunnable screens
tags: [env, rn]
---

## Never use Vitest to render React Native

Vitest has no RN renderer. `happy-dom` plus a screen component is not a native test.

**Incorrect:** `render(<HomeScreen />)` under Vitest for an Expo screen.

**Correct:** Jest (jest-expo if Expo) plus RNTL. Shared hooks stay in a Node Vitest suite. See `react-testing`.

Notes: Node-only helpers used by RN may still use Vitest. The render test may not.
