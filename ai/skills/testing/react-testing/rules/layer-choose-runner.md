---
title: Choose the runner by layer
impact: CRITICAL
impactDescription: wrong runner = false greens or unrunnable tests
tags: [layer, vitest, jest, playwright, maestro]
---

## Choose the runner by layer

Pick the thinnest runner the repo already uses that can observe the behavior. Mixing runners (Vitest rendering RN, Playwright for a class variant) wastes time and lies.

**Incorrect:** Vitest `render` of an Expo screen, or a Playwright spec whose only assertion is a button variant class.

**Correct:**

| Layer | Runner (if present) |
|---|---|
| Schema / keys / API / hooks | Vitest or Jest |
| Web UI | Vitest or Jest + `@testing-library/react` |
| Native presentation | Jest (jest-expo if Expo) + `@testing-library/react-native` |
| Multi-route web / desktop | Playwright |
| Device / emulator | Maestro |
| Authz / multi-user | the repo's integration or DB suite |

Notes: Discover scripts from `package.json` / `justfile`. Do not invent a workspace-wide `pnpm test`. If the repo has no harness, see `pitfall-dont-invent-harness`.
